# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Claude Code Skills Manager (CSM) - macOS 原生 Tauri 应用，用于可视化管理 Claude Code Skills。

**技术栈**: Tauri 2 + React 19 + TypeScript 6 + CSS Modules + Sass + Vite 8 + Zustand

## 常用命令

```bash
# 开发
pnpm dev              # 启动前端开发服务器 (port 1420)
pnpm tauri dev        # 启动 Tauri 应用（完整开发）

# 构建
pnpm build            # 前端构建 (tsc + vite)
pnpm tauri build      # 构建 macOS 应用

# 测试
pnpm test             # 运行单元测试 (watch 模式)
pnpm test:run         # 单次运行单元测试
pnpm test:coverage    # 测试覆盖率
pnpm test:e2e         # E2E 测试 (需先启动 tauri-wd --port 4444)
pnpm test:e2e:install # 安装 E2E 测试依赖

# 代码质量
pnpm lint             # ESLint 检查
pnpm lint:fix         # ESLint 自动修复
pnpm typecheck        # TypeScript 类型检查
pnpm format           # Prettier 格式化
pnpm format:check     # Prettier 检查
```

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
├─────────────────────────────────────────────────────────┤
│  pages/           → 路由页面 (Library, Global, Settings) │
│  components/      → UI 组件                              │
│    ui/            → 基础组件 (Button, Card, Modal, etc.) │
│    features/      → 功能组件 (SkillList, CategoryManager)│
│    layout/        → 布局组件 (MainLayout)                │
│  stores/          → Zustand 状态管理                      │
│  services/        → IPC 服务封装 (调用 Tauri 后端)         │
│  hooks/           → 自定义 Hooks                          │
│  types/           → TypeScript 类型定义                   │
└─────────────────────────────────────────────────────────┘
                          │ invoke()
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend (Rust/Tauri)                   │
├─────────────────────────────────────────────────────────┤
│  src-tauri/src/                                          │
│    lib.rs         → 命令注册入口                          │
│    commands/      → IPC 命令实现                         │
│      library.rs   → Library 技能管理                      │
│      global.rs    → Global Skills 管理                    │
│      project.rs   → Project Skills 管理                   │
│      deploy.rs    → 技能部署                              │
│      storage.rs   → 统一存储层命令                        │
│      update.rs    → 自动更新                              │
│    storage/       → 统一存储层 (config, library, sync)    │
│    services/      → Rust 业务服务                        │
│    utils/         → Rust 工具函数                        │
└─────────────────────────────────────────────────────────┘
```

### 路径别名

- `@/` → `src/` (在 vite.config.ts 中配置)

### IPC 通信流程

1. **Frontend** 调用 `services/*Service.ts` 中的方法
2. **Service** 通过 `ipcService.ts` 封装调用 `invoke(channel, args)`
3. **Backend** 在 `commands/*.rs` 中处理请求
4. **响应格式**: `{ success: true, data: T } | { success: false, error: IPCError }`

### 主要 IPC 通道

| 模块 | 通道示例 | 用途 |
|------|----------|------|
| Library | `library_list`, `library_import`, `library_export` | App Library 技能管理 |
| Global | `global_list`, `global_pull` | Global Skills 管理 |
| Project | `project_list`, `project_skills`, `project_refresh` | Project Skills 管理 |
| Deploy | `deploy_to_global`, `deploy_to_project` | 技能部署 |
| Storage | `storage_config_get`, `storage_library_*` | 统一存储层 |
| Update | `update_check`, `update_download`, `update_install` | 自动更新 |
| Search | `search`, `search_with_snippets` | 统一搜索 |
| iCloud | `icloud_sync_status`, `icloud_resolve_conflict` | iCloud 同步 |

详细 IPC 规范见 `docs/standards/ipc-standards.md`。

### 状态管理

| Store | 用途 | 持久化 |
|-------|------|--------|
| `libraryStore` | Library 技能和分类管理 | categories, groups |
| `projectStore` | 项目监控管理 | projects |
| `globalStore` | 全局技能管理 | 无 |
| `selectionStore` | 统一选择状态 (Library/Global/Project 互斥) | 无 |
| `ideStore` | IDE 配置和切换 | 无 |
| `uiStore` | UI 状态 (toast, modal, theme) | 无 |
| `settingsStore` | 应用设置 | 全部 |
| `updateStore` | 自动更新状态 | 无 |

### 核心类型

类型定义位于 `src/types/skill.ts`:
- `LibrarySkill` - Library 中的技能
- `GlobalSkill` - 全局安装的技能
- `Deployment` - 部署记录
- `Group` / `Category` - 分类组织结构

### 核心 Hooks

| Hook | 用途 |
|------|------|
| `useSelection` | 统一选择逻辑，连接 selectionStore |
| `useSkillFilter` | 统一技能过滤和排序 |
| `useCategoryDragDrop` | Category 拖拽逻辑 |
| `useSidebarDragDrop` | Sidebar 拖拽逻辑 |
| `useBatchDeploy` | 批量部署逻辑 |
| `useSearch` | 统一搜索逻辑 |
| `useUpdate` | 自动更新状态和操作 |

## 设计系统

**重要:** 所有 UI 开发必须遵循设计系统规范。

**设计系统源文件:** `design-system/claude-code-skills-manager/MASTER.md`

核心风格:
- **Glassmorphism** - 三级毛玻璃效果（light/medium/heavy）
- **macOS Native** - 系统字体、圆角、阴影
- **交互动画** - 弹性缓动、悬停抬起、交错入场

页面特定规则: 构建 `pages/` 下的页面时，检查 `design-system/pages/[page-name].md`。

## E2E 测试

基于 tauri-webdriver 的端到端测试，位于 `e2e/` 目录。

**运行 E2E 测试需要 3 个终端:**
```bash
# 终端 1: 前端 dev server
pnpm dev

# 终端 2: WebDriver 服务器
tauri-wd --port 4444

# 终端 3: 运行测试
pnpm test:e2e
```

详细说明见 `e2e/README.md`。

## 调试说明

**⚠️ 强制要求：本项目是 Tauri 应用，调试必须使用 tauri-webdriver**

### 禁止使用的工具

以下工具**无法连接到 Tauri webview**，严禁使用：
- ❌ Chrome DevTools MCP - 无法访问 Tauri 的 WKWebView
- ❌ Playwright MCP - 无法访问 Tauri 的 WKWebView
- ❌ 任何基于 Chrome/Chromium 的浏览器自动化工具

### 正确的调试方法

使用 **tauri-webdriver** (W3C WebDriver 协议实现)：

```bash
# 1. 确保 frontend dev server 运行
curl -s http://localhost:1420 > /dev/null || pnpm dev &

# 2. 启动 WebDriver 服务器
tauri-wd --port 4444

# 3. 创建会话并启动应用 (通过 WebDriver API)
curl -X POST http://localhost:4444/session \
  -H "Content-Type: application/json" \
  -d '{"capabilities":{"alwaysMatch":{"tauri:options":{"binary":"./src-tauri/target/debug/claude-code-skills-manager"}}}}'

# 4. 获取页面源码 (使用返回的 sessionId)
curl http://localhost:4444/session/{sessionId}/source

# 5. 其他操作
curl http://localhost:4444/session/{sessionId}/screenshot  # 截图
curl http://localhost:4444/session/{sessionId}/title       # 页面标题
curl -X DELETE http://localhost:4444/session/{sessionId}   # 关闭应用
```

### MCP 集成 (推荐)

安装 mcp-tauri-automation 可让 Claude Code 直接操作 Tauri 应用：

```bash
# 安装 MCP server
git clone https://github.com/danielraffel/mcp-tauri-automation.git
cd mcp-tauri-automation && npm install && npm run build

# 添加到 Claude Code
claude mcp add --transport stdio tauri-automation \
  --scope user \
  --env TAURI_APP_PATH=/path/to/src-tauri/target/debug/claude-code-skills-manager \
  -- node /absolute/path/to/mcp-tauri-automation/dist/index.js
```

### 手动 DevTools (仅限开发时)

运行 `pnpm tauri dev` 后，在应用窗口中按 `Cmd+Option+I` 可打开 DevTools 进行手动调试。但这不适合自动化操作。

### 参考文档

- [tauri-webdriver GitHub](https://github.com/danielraffel/tauri-webdriver)
- 本地文档: `docs/tauri-webdriver.md`

## 开发规范

详细规范位于 `docs/standards/` 目录。

### Git 提交格式

```
<type>(<scope>): <subject>
```

**Type**: `feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `chore`
**Scope**: `skill` | `search` | `ipc` | `ui` | `store` | `deploy`

示例: `feat(skill): add batch install feature`

### 关键规范文件

| 文件 | 内容 |
|------|------|
| `ipc-standards.md` | IPC 通道命名、响应格式、错误处理 |
| `state-management.md` | Zustand store 模式、选择器模式 |
| `testing-standards.md` | 单元测试结构、Vitest 配置 |
| `git-standards.md` | 提交格式、分支命名、PR 规范 |

## CI/CD 发布流程

项目使用 GitHub Actions 自动构建和发布。

### 发布新版本

```bash
# 1. 更新版本号（自动更新 package.json, tauri.conf.json, Cargo.toml）
pnpm version 0.2.1

# 2. 提交并创建 tag
git add -A && git commit -m "chore: bump version to 0.2.1"
git tag v0.2.1

# 3. 推送（触发 Release 工作流）
git push origin main && git push origin v0.2.1
```

### 工作流说明

| 工作流 | 触发条件 | 内容 |
|--------|----------|------|
| CI | push/PR 到 main | lint, test, build |
| Release | 推送 `v*` tag | 构建 DMG, 发布 GitHub Release |

详细说明见 `.github/CI-CD.md`。

## BMad 框架

项目使用 BMad 进行开发流程管理：

- 配置文件: `_bmad/config.toml`
- 输出目录: `_bmad-output/`
- Skills 目录: `.claude/skills/`

### 开发流程规范

详细流程请参考 `docs/standards/bmad-workflow.md`，包含：

- **Phase 1: 发现阶段** - 产品简报、PRD、市场研究
- **Phase 2: 规划阶段** - UX 设计、架构决策、Epic/Story 分解
- **Phase 3: 准备阶段** - 完整性检查、Sprint 规划、Story 上下文填充
- **Phase 4: 实现阶段** - Story 开发、测试、代码审查
- **Phase 5: 回顾阶段** - Epic 回顾、经验提取、下一迭代准备

### 快速参考

```bash
# 典型开发流程
/bmad-product-brief      # 创建产品简报
/bmad-create-prd         # 创建 PRD
/bmad-create-architecture # 架构设计
/bmad-create-epics-and-stories # 分解 Epic/Story
/bmad-sprint-planning    # Sprint 规划
/bmad-create-story       # 创建 Story
/bmad-dev-story          # 实现 Story
/bmad-code-review        # 代码审查
/bmad-retrospective      # Epic 回顾
```
