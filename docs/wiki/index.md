# Open Skills Manager 项目 Wiki

## 目录

1. [项目概述](#1-项目概述)
2. [路由系统与布局结构](#2-路由系统与布局结构)
3. [Library 页面](#3-library-页面)
4. [Global 页面](#4-global-页面)
5. [Settings 页面](#5-settings-页面)
6. [IPC 服务层架构](#6-ipc-服务层架构)
7. [状态管理架构](#7-状态管理架构)
8. [iCloud 同步机制](#8-icloud-同步机制)

---

## 1. 项目概述

### 1.1 项目简介

**Claude Code Skills Manager (CSM)** 是一款 macOS 原生 Tauri 应用，用于可视化管理 Claude Code Skills。

### 1.2 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Tauri | 2 | 桌面应用框架 |
| React | 19 | 前端 UI 框架 |
| TypeScript | 6 | 类型安全 |
| CSS Modules + Sass | - | 样式方案 |
| Vite | 8 | 构建工具 |
| Zustand | - | 状态管理 |

### 1.3 架构概览

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
│    storage/       → 统一存储层                           │
│    services/      → Rust 业务服务                        │
│    utils/         → Rust 工具函数                        │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 路由系统与布局结构

### 2.1 路由配置

项目使用 `react-router-dom` 的 `createBrowserRouter` 配置路由。

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | `RootLayout` | 根布局，包含全局组件 |
| `/` (index) | - | 默认重定向到 `/library` |
| `/library` | `Library` | Library 技能列表页 |
| `/library/:skillId` | `SkillDetailPage` | 技能详情页（占位符） |
| `/global` | `Global` | Global Skills 页面 |
| `/projects` | `ProjectsPage` | 项目列表页（占位符） |
| `/projects/:projectId` | `ProjectSkillsView` | 项目技能视图 |
| `/settings` | `Settings` | 设置页面 |

### 2.2 布局结构

```
RootLayout
├── MainLayout        // 主布局（侧边栏 + 内容区）
├── ToastContainer    // 全局 Toast 通知
└── ConfirmDialog     // 全局确认对话框

MainLayout
├── aside (sidebar)
│   ├── sidebarHeader     // Logo 区域
│   └── sidebarNav        // 导航区域
│       ├── navSection (Library)    // 可折叠
│       │   └── CategoryManager    // Groups/Categories 树
│       ├── navSection (Scopes)     // 可折叠
│       │   ├── GlobalSkillsItem   // Global Skills 入口
│       │   └── ProjectListContainer // 项目列表
│       └── NavLink (Settings)      // 设置入口
├── main
│   ├── topBar            // 顶部工具栏
│   │   ├── searchWrapper // 搜索框
│   │   ├── IDESwitcher   // IDE 切换器
│   │   └── ICloudStatus  // iCloud 同步状态
│   └── content           // 页面内容区
│       └── <Outlet />    // 路由出口
└── 全局对话框
```

### 2.3 侧边栏导航链路

#### Library 导航

```
点击 Group/Category
  → handleSelectLibrary(groupId, categoryId)
    → selectionStore.selectLibrary()
    → libraryStore.selectGroup()/selectCategory()
    → navigate('/library')
```

#### Global Skills 导航

```
点击 Global Skills
  → handleClick()
    → selectionStore.selectGlobal()
    → navigate('/global')
```

#### Project 导航

```
点击 Project
  → handleSelectProject(projectId)
    → selectionStore.selectProject()
    → projectStore.selectProject()
    → navigate(`/projects/${projectId}`)
```

### 2.4 主题系统

| 主题模式 | HTML 类 | 说明 |
|---------|---------|------|
| `dark` | `<html>` | 默认深色 |
| `light` | `<html class="light">` | 浅色主题 |
| `system` | 跟随系统偏好 | 监听 `prefers-color-scheme` |

---

## 3. Library 页面

### 3.1 页面基础信息

| 属性 | 值 |
|------|-----|
| 页面名称 | Library |
| 路由路径 | `/library` |
| 主要功能 | 技能库管理，包含技能的导入、导出、删除、部署、分类管理及冲突解决 |

### 3.2 初始化加载链路

**触发条件**：组件挂载

**执行步骤**：
1. `useEffect` 触发 `loadSkills` 异步函数
2. 调用 `setLoading(true)` 设置加载状态
3. 调用 `libraryService.list()` 发起 IPC 请求 (`library_list`)
4. 成功: `setSkills(result.data)` / 失败: `setError(result.error.message)`
5. `setLoading(false)` 结束加载状态

**数据流转**：
```
组件挂载 → libraryStore.isLoading = true
    → libraryService.list() → IPC('library_list')
    → libraryStore.skills = result.data
    → useLibraryFilters 计算过滤后的 filteredSkills
    → SkillList 组件渲染
```

### 3.3 核心业务操作链路

#### 导入技能链路

```
点击 Import → ImportDialog 打开
    → 选择路径 → handleImportStart(paths, categoryId, groupId)
    → 显示 ImportProgress
    → 循环: libraryService.import({ path, categoryId, groupId })
    → completeImport(successful, failed, skipped)
    → libraryService.list() 刷新列表
    → refreshLibrary() 刷新侧边栏
```

#### 导出技能链路

```
点击 Export → ExportDialog 打开
    → 选择格式 → handleExportStart(format, skills)
    → 显示 ExportProgress
    → 系统保存对话框
    → libraryService.export(id, format, destPath)
    → showToast('success')
```

#### 删除技能链路

```
点击 Delete → showConfirmDialog() 确认
    → libraryService.delete(skillId)
    → removeSkill(skillId)
    → 清除选中状态（如当前选中）
    → refreshLibrary() 刷新侧边栏
```

#### 部署技能链路

```
点击 Deploy → BatchDeployTargetDialog 打开
    → 选择目标:
      - Library: libraryService.organize()
      - Global: startDeploy(skills, { targetScope: 'global' })
      - Project: startDeploy(skills, { targetScope: 'project', projectId })
    → BatchDeployDialog 显示进度
```

#### 冲突解决链路

```
iCloud 同步冲突 → 显示冲突横幅
    → 点击打开 ConflictDialog
    → 选择解决方案 (local/remote/both)
    → resolveConflict(skillId, resolution)
    → 刷新技能列表
```

### 3.4 组件结构

```
Library.tsx
├── SkillListLayout (布局容器)
│   ├── SkillListHeader (标题栏 + 搜索 + 排序 + Import 按钮)
│   ├── Error Block (错误显示)
│   ├── Conflict Banner (冲突提示横幅)
│   └── SkillList (技能列表)
├── SkillPreviewModal (技能详情预览)
├── ImportDialog / ImportProgress (导入)
├── ExportDialog / ExportProgress (导出)
├── BatchDeployTargetDialog / BatchDeployDialog (部署)
└── ConflictDialog (冲突解决)
```

---

## 4. Global 页面

### 4.1 页面基础信息

| 属性 | 值 |
|------|------|
| 页面名称 | Global |
| 路由路径 | `/global` |
| 主要功能 | 管理全局安装的技能 |
| 数据源 | `~/.claude/skills/` 目录 |

### 4.2 初始化加载链路

**触发条件**：组件挂载

**执行步骤**：
1. `setLoading(true)`
2. `globalService.list()` → IPC: `global_list`
3. 成功: `setSkills(result.data)` / 失败: `setError(message)`
4. `setLoading(false)`

### 4.3 核心业务操作链路

#### 刷新技能列表链路

```
点击 Refresh → setRefreshing(true)
    → globalService.list()
    → setSkills(data) + setLastRefreshAt(new Date())
    → showToast('success')
    → setRefreshing(false)
```

#### 删除技能链路

```
点击 Delete → showConfirmDialog() 确认
    → globalService.delete(skillId)
    → removeSkill(skillId)
    → 清除选中状态
    → refreshGlobal() 刷新侧边栏
```

#### 部署技能链路

```
点击 Deploy → BatchDeployTargetDialog 打开
    → 选择目标:
      - Library: libraryService.import()
      - Project: startDeploy([skill], { targetScope: 'project' })
    → BatchDeployDialog 显示进度
```

### 4.4 组件结构

```
Global.tsx
├── SkillListLayout
│   ├── SkillListHeader (含刷新按钮)
│   └── SkillList
├── SkillPreviewModal
├── ExportDialog
├── BatchDeployTargetDialog
└── BatchDeployDialog
```

---

## 5. Settings 页面

### 5.1 页面基础信息

| 属性 | 值 |
|------|-----|
| 页面名称 | Settings |
| 路由路径 | `/settings` |
| 主要功能 | 管理应用设置，包括主题、iCloud 同步、自动更新、恢复出厂设置 |

### 5.2 初始化加载链路

**触发条件**：组件挂载

**执行步骤**：
1. `getVersion()` / `getName()` 获取应用信息
2. `useIcloudSync.refresh()` 初始化 iCloud 同步状态
3. `useAutoUpdate` 自动检查更新（如果启用）

### 5.3 核心业务操作链路

#### iCloud 同步链路

```
点击 Force Sync → forceSync()
    → storageService.forceSync() → IPC: storage_sync_force
    → 刷新同步状态
    → showToast('success')
```

#### 打开数据目录链路

```
点击 Open in Finder → configService.getAppDataPath()
    → configService.openPath(path)
```

#### 恢复出厂设置链路

```
点击 Reset → showConfirmDialog() 确认
    → storageService.resetToDefaults()
    → 重置所有前端 stores
    → refreshAll() 刷新侧边栏
```

#### 自动更新链路

```
点击 Check Now → checkForUpdates()
    → 有更新 → 显示 Download & Install 按钮
    → 点击下载 → downloadAndInstall()
    → 下载完成 → relaunch() 重启应用
```

### 5.4 组件结构

```
Settings.tsx
├── header (标题)
└── content
    ├── section (Appearance)
    │   └── Theme 下拉框
    ├── ICloudSettings (iCloud 同步设置)
    └── section (About)
        ├── Version 信息
        ├── Auto Check for Updates
        ├── Update Available / Check for Updates
        ├── Storage Usage
        ├── Data Directory
        └── Factory Reset
```

---

## 6. IPC 服务层架构

### 6.1 IPC 调用封装

```
Frontend Service → invokeIPC() → Tauri invoke() → Backend Command → IpcResult<T>
```

**响应格式**：
```typescript
// 成功
{ success: true, data: T }

// 失败
{ success: false, error: { code: string, message: string } }
```

### 6.2 服务模块列表

| 服务文件 | 功能描述 |
|---------|---------|
| `ipcService.ts` | IPC 调用核心封装 |
| `storageService.ts` | 统一存储层 (核心) |
| `libraryService.ts` | App Library 技能管理 |
| `globalService.ts` | Global Skills 管理 |
| `projectService.ts` | Project Skills 管理 |
| `deployService.ts` | 技能部署服务 |
| `searchService.ts` | 统一搜索服务 |
| `configService.ts` | 配置服务 (兼容层) |
| `ideService.ts` | IDE 配置管理 |
| `icloudService.ts` | iCloud 原生操作 |
| `updateService.ts` | 自动更新服务 |

### 6.3 主要 IPC 通道映射

#### Library 模块

| 通道名称 | 用途 |
|---------|------|
| `library_list` | 列出所有技能 |
| `library_get` | 获取技能详情 |
| `library_delete` | 删除技能 |
| `library_import` | 导入技能 |
| `library_export` | 导出技能 |
| `library_organize` | 组织分类 |
| `library_groups_*` | 分组管理 |
| `library_categories_*` | 分类管理 |

#### Global 模块

| 通道名称 | 用途 |
|---------|------|
| `global_list` | 列出全局技能 |
| `global_get` | 获取技能详情 |
| `global_delete` | 删除技能 |

#### Project 模块

| 通道名称 | 用途 |
|---------|------|
| `project_list` | 列出监控项目 |
| `project_add` | 添加项目 |
| `project_remove` | 移除项目 |
| `project_skills` | 列出项目技能 |
| `project_refresh` | 刷新项目 |

#### Deploy 模块

| 通道名称 | 用途 |
|---------|------|
| `deploy_to_global` | 部署到 Global |
| `deploy_to_project` | 部署到项目 |
| `deploy_to_global_for_ide` | 跨 IDE 部署 |

#### Storage 模块

| 通道名称 | 用途 |
|---------|------|
| `storage_config_get` | 获取配置 |
| `storage_config_set_settings` | 更新设置 |
| `storage_sync_state` | 获取同步状态 |
| `storage_sync_force` | 强制同步 |
| `storage_reset_to_defaults` | 恢复出厂设置 |

---

## 7. 状态管理架构

### 7.1 Store 概览

| Store | 用途 | 持久化 |
|-------|------|--------|
| `libraryStore` | Library 技能和分类管理 | `groups` |
| `globalStore` | 全局技能管理 | 无 |
| `projectStore` | 项目监控管理 | `projects` |
| `selectionStore` | 统一选择状态 | 无 |
| `ideStore` | IDE 配置和切换 | 无 |
| `uiStore` | UI 状态 | `viewMode` |
| `settingsStore` | 应用设置 | 全部 |
| `updateStore` | 自动更新状态 | 无 |

### 7.2 Store 依赖关系

```
                ┌──────────────────┐
                │  selectionStore  │ ← 统一选择协调者
                └────────┬─────────┘
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ libraryStore │  │ globalStore  │  │ projectStore │
└──────────────┘  └──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│settingsStore │  │   uiStore    │  │  ideStore    │
│ (双向同步)    │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
       │
       ▼
storageService.setSettings() ← 双向同步到后端
```

### 7.3 选择器模式

```typescript
// ✅ 正确: 单字段选择器
const skills = useLibraryStore((state) => state.skills);

// ✅ 正确: 批量选择相关字段
const { skills, selectedSkill } = useLibraryStore((state) => ({
  skills: state.skills,
  selectedSkill: state.selectedSkill,
}));

// ❌ 错误: 选择整个 Store
const store = useLibraryStore(); // 任何状态变化都会触发重渲染
```

### 7.4 Hook 封装

| Hook | 封装的 Store | 用途 |
|------|--------------|------|
| `useSelection` | `selectionStore`, `libraryStore`, `projectStore` | 统一选择逻辑 |
| `useSkillFilter` | 无 | 技能过滤和排序 |
| `useBatchDeploy` | `libraryStore`, `globalStore`, `projectStore` | 批量部署逻辑 |
| `useSearch` | `uiStore` | 搜索逻辑 |
| `useAutoUpdate` | `updateStore` | 自动更新逻辑 |

---

## 8. iCloud 同步机制

### 8.1 概述

iCloud 同步功能允许用户在多台设备间同步 Library 技能数据。

**详细文档**: [icloud-sync.md](./icloud-sync.md)

### 8.2 核心组件

| 组件 | 职责 |
|------|------|
| `useIcloudSync` | 同步状态管理、强制同步触发 |
| `useOfflineSync` | 离线队列、冲突检测与解决 |
| `icloudService` | iCloud 原生操作 IPC 封装 |

### 8.3 同步状态

| 状态 | 说明 |
|------|------|
| `synced` | 已同步，无待处理变更 |
| `syncing` | 同步中 |
| `pending` | 有待同步的变更 |
| `offline` | iCloud 不可用 |
| `error` | 同步失败 |

### 8.4 同步触发机制

- **自动同步**: 应用启动时、每 5 秒轮询、从离线恢复在线时
- **手动同步**: Settings 页面 "Force Sync Now" 按钮

### 8.5 离线队列

离线时的变更会存入队列，恢复在线后自动同步：
- 变更类型: `create` | `update` | `delete`
- 持久化: localStorage (`csm_offline_changes`)

### 8.6 冲突解决

当检测到同步冲突时：
1. 显示冲突横幅提示用户
2. 打开 ConflictDialog 显示冲突详情
3. 用户选择解决方案: `local` | `remote` | `both`
4. 执行解决并刷新数据

---

## 附录

### 常用命令

```bash
# 开发
pnpm dev              # 启动前端开发服务器
pnpm tauri dev        # 启动 Tauri 应用

# 构建
pnpm build            # 前端构建
pnpm tauri build      # 构建 macOS 应用

# 测试
pnpm test             # 单元测试
pnpm test:e2e         # E2E 测试

# 代码质量
pnpm lint             # ESLint 检查
pnpm typecheck        # TypeScript 类型检查
```

### 相关文档

- [IPC 标准规范](../standards/ipc-standards.md)
- [状态管理规范](../standards/state-management.md)
- [测试标准](../standards/testing-standards.md)
- [Git 规范](../standards/git-standards.md)
