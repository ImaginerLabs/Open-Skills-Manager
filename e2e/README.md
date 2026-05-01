# E2E Tests

基于 [tauri-webdriver](https://github.com/danielraffel/tauri-webdriver) 的端到端测试。

## 前提条件

1. **已安装 `tauri-wd` CLI**
   ```bash
   cargo install tauri-webdriver-automation
   ```

2. **已构建 debug 版本**
   ```bash
   cd src-tauri && cargo build
   ```

3. **已安装 e2e 依赖**
   ```bash
   cd e2e && npm install
   # 或从项目根目录
   pnpm test:e2e:install
   ```

## 运行测试

需要 **3 个终端**同时运行：

### 终端 1：启动前端 dev server
```bash
pnpm dev
```

### 终端 2：启动 WebDriver 服务器
```bash
tauri-wd --port 4444
```

### 终端 3：运行测试
```bash
# 从项目根目录
pnpm test:e2e

# 或从 e2e 目录
cd e2e && npm test
```

## 测试结构

```
e2e/
├── config/
│   └── constants.mjs          # 全局常量 (TIMEOUTS, SELECTORS, ROUTES)
├── fixtures/
│   └── test-data.helper.mjs   # 测试数据管理 (创建/清理/还原)
├── helpers/
│   ├── wait.helper.mjs        # 等待工具
│   ├── tauri.helper.mjs       # Tauri IPC 封装
│   └── assertion.helper.mjs   # 自定义断言
├── pageobjects/
│   ├── base.page.mjs          # 基础页面对象
│   ├── library.page.mjs       # Library 页面
│   ├── global.page.mjs        # Global 页面
│   ├── settings.page.mjs      # Settings 页面
│   └── components/
│       ├── dialog.component.mjs
│       ├── toast.component.mjs
│       └── skill-card.component.mjs
└── specs/
    ├── smoke.spec.mjs              # 冒烟测试
    ├── library/
    │   ├── skill-list.spec.mjs     # 技能列表
    │   ├── skill-import.spec.mjs   # 技能导入
    │   ├── skill-deploy.spec.mjs   # 技能部署
    │   └── skill-export.spec.mjs   # 技能导出
    ├── global/
    │   └── global-skills.spec.mjs  # Global 技能管理
    ├── projects/
    │   └── project-management.spec.mjs  # 项目管理
    └── settings/
        └── settings.spec.mjs      # 设置页面
```

## 测试数据隔离

所有测试数据使用 `e2e-test-` 前缀，确保：

1. **创建前**：`captureInitialState()` 记录当前状态
2. **测试中**：通过 `TestDataManager` 创建和追踪测试数据
3. **测试后**：`restoreToInitialState()` + `cleanup()` 完整还原
4. **验证**：`verifyCleanup()` 检测是否有残留数据

```javascript
before(async () => {
  await dataManager.captureInitialState();
  skillDir = await dataManager.createTestSkill('my-test');
});

after(async () => {
  await dataManager.restoreToInitialState();
  await dataManager.cleanup();
});
```

## 技术要点与踩坑记录

### WebDriverIO v9 + WKWebView 兼容性问题

Tauri 使用 WKWebView 作为渲染引擎，与 WebDriverIO v9 存在兼容性问题：

#### 问题 1: `Node.contains` 错误
**现象**：调用 `element.isExisting()`, `element.isDisplayed()`, `element.getText()` 等方法时抛出 `Node.contains` 错误。

**原因**：WebDriverIO v9 内部使用 `Node.contains()` 检查元素是否存在于 DOM 中，但 WKWebView 的 WebDriver 实现对此支持不完善，导致 stale element reference 错误。

**解决方案**：使用 `browser.execute()` 直接操作 DOM，绕过 WebDriverIO 的元素封装：

```javascript
// ❌ 错误方式 - 会触发 Node.contains 错误
const text = await $(selector).getText();

// ✅ 正确方式 - 使用原生 DOM API
const text = await browser.execute((sel) => {
  const el = document.querySelector(sel);
  return el ? el.textContent : '';
}, selector);
```

#### 问题 2: React 受控输入组件无法输入
**现象**：使用 `element.setValue()` 或 `element.addValue()` 无法向搜索框等输入框填入文本，React 状态不更新。

**原因**：React 的受控组件通过 synthetic event 管理输入状态，直接设置 `value` 属性会被 React 忽略。

**解决方案**：使用原生 input value setter 绕过 React 的受控输入保护：

```javascript
async type(selector, text) {
  await browser.execute((sel, value) => {
    const el = document.querySelector(sel);
    if (!el) return;

    // 获取原生 input value setter，绕过 React 的 read-only 保护
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;

    // 使用原生 setter 设置值
    nativeInputValueSetter.call(el, value);

    // 触发 React 的 synthetic event
    el.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: false,
      data: value,
      inputType: 'insertText',
    }));

    el.blur();
  }, selector, text);
}
```

#### 问题 3: 对话框关闭方式
**现象**：按 Escape 键无法关闭对话框。

**解决方案**：点击对话框的遮罩层（overlay backdrop）来关闭：

```javascript
async closeDialog(testId) {
  await browser.execute((id) => {
    const dialog = document.querySelector(`[data-testid="${id}"]`);
    if (dialog) {
      // 点击遮罩层关闭对话框
      const overlay = dialog.parentElement;
      if (overlay) overlay.click();
    }
  }, testId);
}
```

### Tauri IPC 调用模式

Tauri 的 IPC 调用是异步的，但 WebDriver 的 `execute()` 是同步的。使用轮询模式处理：

```javascript
export async function invoke(command, args = {}) {
  // 生成唯一回调 ID
  const callbackId = `tauri_invoke_${Date.now()}_${Math.random()}`;

  // 启动异步调用
  await browser.execute((cmd, a, cid) => {
    window.__TAURI_CALLBACKS__ = window.__TAURI_CALLBACKS__ || {};
    window.__TAURI_CALLBACKS__[cid] = { status: 'pending', result: null };

    window.__TAURI_INTERNALS__.invoke(cmd, a)
      .then((res) => {
        window.__TAURI_CALLBACKS__[cid] = { status: 'done', result: res };
      })
      .catch((err) => {
        window.__TAURI_CALLBACKS__[cid] = { status: 'error', error: err };
      });
  }, command, args, callbackId);

  // 轮询等待结果
  await browser.waitUntil(async () => {
    const status = await browser.execute((cid) => {
      return window.__TAURI_CALLBACKS__?.[cid];
    }, callbackId);
    return status?.status === 'done' || status?.status === 'error';
  }, { timeout: 10000 });

  // 获取结果
  const result = await browser.execute((cid) => {
    return window.__TAURI_CALLBACKS__?.[cid];
  }, callbackId);

  return result?.result;
}
```

### 文件对话框限制

Tauri 的原生文件对话框（`open()`, `save()`）无法通过 WebDriver 自动化。测试策略：

1. **导入测试**：直接使用 IPC 调用 `library_import` 绕过文件选择对话框
2. **导出测试**：验证导出对话框 UI 正确显示，实际导出逻辑在单元测试覆盖

### 测试数据创建注意事项

创建测试项目时，确保目录结构与后端期望一致。后端从目录名获取项目名称：

```javascript
// ❌ 错误方式 - mkdtemp 创建随机目录名
const projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'project-'));
// 后端获取的项目名: "project-a1b2c3"

// ✅ 正确方式 - 在临时目录内创建具名子目录
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'temp-'));
const projectDir = path.join(tempDir, 'e2e-test-my-project');
await fs.mkdir(projectDir, { recursive: true });
// 后端获取的项目名: "e2e-test-my-project"
```

### React Router v6 导航

使用 `history.pushState` 进行导航，避免页面刷新导致的 Tauri webdriver 连接丢失：

```javascript
async open(path = '') {
  await browser.execute((url) => {
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
  await this.waitForLoad();
}
```

## 自定义二进制路径

通过环境变量覆盖默认路径：

```bash
TAURI_APP_PATH=/custom/path/to/debug/binary pnpm test:e2e
```

## 调试

增加日志级别：

```bash
# 方式 1：环境变量
LOG_LEVEL=debug pnpm test:e2e

# 方式 2：修改 wdio.conf.mjs
logLevel: 'debug',  // 可选: trace | debug | info | warn | error
```

测试失败时自动截图保存到 `e2e/screenshots/` 目录。

## CI 环境变量

| 变量 | 用途 | 默认值 |
|------|------|--------|
| `TAURI_APP_PATH` | Tauri 二进制路径 | `src-tauri/target/debug/...` |
| `LOG_LEVEL` | 日志级别 | `warn` |
| `CI` | CI 模式（增加重试次数） | 未设置 |
