# Open Skills Manager

<p align="center">
  <strong>macOS 原生应用，可视化管理 AI IDE Skills</strong>
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#下载安装">下载安装</a> •
  <a href="#开发">开发</a> •
  <a href="#技术栈">技术栈</a>
</p>

---

## 功能特性

- 🗂️ **可视化管理** - 图形化界面管理 Claude Code Skills、Cursor Rules 等
- 📚 **Library 管理** - 本地技能库，支持分组、分类、图标
- 🌐 **Global Skills** - 管理全局安装的技能
- 📁 **Project Skills** - 自动检测项目，管理项目级技能
- 🔄 **批量操作** - 批量导入、导出、部署技能
- 🔍 **统一搜索** - 快速搜索所有技能
- ☁️ **iCloud 同步** - 支持 iCloud 同步技能库
- 🎨 **现代 UI** - Glassmorphism 毛玻璃效果，原生 macOS 体验

## 下载安装

### 系统要求

- macOS 11.0 (Big Sur) 或更高版本

### 从 Release 下载

1. 前往 [Releases](https://github.com/ImaginerLabs/Open-Skills-Manager/releases) 页面
2. 下载对应架构的 DMG 文件：
   - **Apple Silicon (M1/M2/M3)**: `Open-Skills-Manager_aarch64.dmg`
   - **Intel (x86_64)**: `Open-Skills-Manager_x86_64.dmg`
3. 双击打开 DMG，将应用拖入 Applications 文件夹
4. **重要**: 打开终端，运行以下命令移除隔离属性：
   ```bash
   xattr -cr "/Applications/Open Skills Manager.app"
   ```
5. 现在可以正常打开应用了

> ⚠️ 应用未签名，上述命令是必须步骤，否则 macOS 会提示「已损坏」。

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/ImaginerLabs/Open-Skills-Manager.git
cd Open-Skills-Manager

# 安装依赖
pnpm install

# 开发模式
pnpm tauri dev

# 构建生产版本
pnpm tauri build
```

## 开发

### 常用命令

```bash
# 开发
pnpm dev              # 启动前端开发服务器
pnpm tauri dev        # 启动 Tauri 应用

# 构建
pnpm build            # 前端构建
pnpm tauri build      # 构建 macOS 应用

# 测试
pnpm test             # 单元测试 (watch 模式)
pnpm test:run         # 单次运行单元测试
pnpm test:e2e         # E2E 测试

# 代码质量
pnpm lint             # ESLint 检查
pnpm typecheck        # TypeScript 类型检查
pnpm format           # Prettier 格式化
```

### 项目结构

```
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   │   ├── ui/            # 基础 UI 组件
│   │   ├── features/      # 功能组件
│   │   └── layout/        # 布局组件
│   ├── pages/             # 页面组件
│   ├── stores/            # Zustand 状态管理
│   ├── services/          # IPC 服务封装
│   ├── hooks/             # 自定义 Hooks
│   └── types/             # TypeScript 类型
├── src-tauri/             # Rust 后端
│   └── src/
│       ├── commands/      # IPC 命令
│       ├── services/      # 业务服务
│       └── utils/         # 工具函数
├── e2e/                   # E2E 测试
└── docs/                  # 文档
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19, TypeScript 6, CSS Modules, Sass |
| 构建 | Vite 8 |
| 桌面 | Tauri 2 |
| 状态 | Zustand 5 |
| 后端 | Rust |
| 测试 | Vitest, WebDriverIO |

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
