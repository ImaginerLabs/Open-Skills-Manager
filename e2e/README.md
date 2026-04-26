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

| 文件 | 描述 |
|------|------|
| `wdio.conf.mjs` | WebDriverIO 配置 |
| `specs/smoke.spec.mjs` | 基础冒烟测试 |
| `specs/library.spec.mjs` | Library 页面测试 |

## 自定义二进制路径

通过环境变量覆盖默认路径：

```bash
TAURI_APP_PATH=/custom/path/to/debug/binary pnpm test:e2e
```

## 调试

增加日志级别：

```bash
# 修改 wdio.conf.mjs 中的 logLevel
logLevel: 'debug',  // 可选: trace | debug | info | warn | error
```
