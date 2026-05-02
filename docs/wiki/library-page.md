# Library 页面 Wiki

## 1. 页面基础信息

| 属性 | 值 |
|------|-----|
| 页面名称 | Library |
| 路由路径 | `/library` |
| 主要功能 | 技能库管理，包含技能的导入、导出、删除、部署、分类管理及冲突解决 |
| 源文件 | `src/pages/Library/Library.tsx` |

---

## 2. 初始化加载链路

### 链路名称：页面初始化加载

**触发条件**：组件挂载 (`useEffect` 执行)

**执行步骤**：

| 步骤 | 操作 | 代码位置 |
|------|------|----------|
| 1 | `setLoading(true)` 设置加载状态 | Library.tsx:115 |
| 2 | `libraryService.list()` 发起 IPC 请求 | Library.tsx:117 |
| 3 | 后端执行 `library_list` IPC 命令 | libraryService.ts |
| 4 | 成功: `setSkills(result.data)` | Library.tsx:119 |
| 5 | 失败: `setError(result.error.message)` | Library.tsx:121 |
| 6 | `setLoading(false)` 结束加载状态 | Library.tsx:126 |

**数据流转**：

```
组件挂载
    ↓
libraryStore.isLoading = true
    ↓
libraryService.list() → IPC('library_list') → Rust 后端
    ↓
响应 { success: true, data: LibrarySkill[] }
    ↓
libraryStore.skills = result.data
libraryStore.isLoading = false
    ↓
useLibraryFilters 计算过滤后的 filteredSkills
    ↓
SkillList 组件渲染
```

**异常处理**：

| 异常类型 | 处理方式 |
|----------|----------|
| IPC 请求失败 | `setError(result.error.message)` 并显示错误区块 |
| 网络错误/异常 | `catch` 块捕获，设置通用错误信息 "Failed to load skills" |
| 数据为空 | 显示空状态 UI ("Your library is empty") |

---

## 3. 核心业务操作链路

### 3.1 导入技能链路

**链路名称**：Import Skill

**触发条件**：点击 Import 按钮 → 打开 ImportDialog → 选择路径 → 确认导入

**执行步骤**：

| 步骤 | 操作 |
|------|------|
| 1 | 用户点击 Import 按钮，`setImportDialog(true)` 打开对话框 |
| 2 | 用户选择路径并确认，触发 `handleImportStart(paths, categoryId, groupId)` |
| 3 | `setShowImportProgress(true)` 显示进度对话框 |
| 4 | `startImport(paths.length)` 初始化导入进度状态 |
| 5 | 循环处理每个路径: `libraryService.import({ path, categoryId, groupId })` |
| 6 | `completeImport(successful, failed, skipped, failedItems)` 完成导入 |
| 7 | 如果有成功项，调用 `libraryService.list()` 刷新列表 |
| 8 | 调用 `refreshLibrary()` 刷新侧边栏统计数据 |

**数据流转**：

```
ImportDialog.onImportStart(paths, categoryId, groupId)
    ↓
useLibraryImport.handleImportStart()
    ↓
libraryStore.startImport(total) → importProgress.status = 'importing'
    ↓
循环: libraryService.import({ path, categoryId, groupId })
    ↓ IPC('library_import')
libraryStore.updateImportProgress(current, skillName)
    ↓
libraryStore.completeImport() → importProgress.status = 'completed'
    ↓
libraryService.list() → 刷新 skills 数组
    ↓
refreshLibrary() → 刷新侧边栏
```

**异常处理**：

| 异常类型 | 处理方式 |
|----------|----------|
| 单个导入失败 | 记录到 `failedItems` 数组，继续处理下一个 |
| 用户取消 | 停止循环，标记剩余项为 `skipped` |
| 网络异常 | `catch` 捕获，添加到 `failedItems` |

---

### 3.2 导出技能链路

**链路名称**：Export Skill

**触发条件**：点击技能卡片的 Export 按钮 → 选择格式 → 确认导出

**执行步骤**：

| 步骤 | 操作 |
|------|------|
| 1 | 用户点击 Export，`setExportSkills([skill])` 并 `setExportDialog(true)` |
| 2 | 用户选择导出格式 并确认 |
| 3 | `onExportStart(format, skillsToExport)` 被调用 |
| 4 | `setExportDialog(false)` 关闭对话框，`setExportProgress(true)` 显示进度 |
| 5 | 根据格式处理: 单个导出或批量导出 |
| 6 | 导出过程中弹出系统保存对话框 |
| 7 | `completeExport()` 完成导出，显示成功 toast |

**数据流转**：

```
SkillCard.onExport(skill)
    ↓
setExportSkills([skill]), setExportDialog(true)
    ↓
ExportDialog.onExportStart(format, skills)
    ↓
useLibraryExport.handleExportStart()
    ↓
libraryStore.startExport(total) → exportProgress.status = 'exporting'
    ↓
系统保存对话框
    ↓
libraryService.export(id, format, destPath) → IPC('library_export')
    ↓
libraryStore.completeExport() → showToast('success')
```

---

### 3.3 删除技能链路

**链路名称**：Delete Skill

**触发条件**：点击技能卡片的 Delete 按钮 → 确认删除

**执行步骤**：

| 步骤 | 操作 |
|------|------|
| 1 | 用户点击 Delete，触发 `handleDeleteSkill(skillId)` |
| 2 | `showConfirmDialog()` 弹出确认对话框 |
| 3 | 用户确认后: `closeConfirmDialog()` 关闭对话框 |
| 4 | `setLoading(true)` 设置加载状态 |
| 5 | 调用 `libraryService.delete(skillId)` |
| 6 | 成功后: `removeSkill(skillId)` 从 store 移除 |
| 7 | 如果删除的是当前选中技能，`selectSkill(null)` 取消选中 |
| 8 | `refreshLibrary()` 刷新侧边栏 |

**数据流转**：

```
SkillCard.onDelete(skillId)
    ↓
showConfirmDialog({ title, message, onConfirm })
    ↓
用户确认 → onConfirm()
    ↓
libraryService.delete(skillId) → IPC('library_delete')
    ↓
libraryStore.removeSkill(skillId) → skills = skills.filter(...)
    ↓
如果 selectedSkill.id === skillId → selectSkill(null)
    ↓
refreshLibrary() → 刷新侧边栏统计
```

---

### 3.4 部署技能链路

**链路名称**：Deploy Skill

**触发条件**：点击技能卡片的 Deploy 按钮 → 选择目标 → 确认部署

**执行步骤**：

| 步骤 | 操作 |
|------|------|
| 1 | 用户点击 Deploy，`setDeploySkills([skill])` 并 `setShowDeployTargetDialog(true)` |
| 2 | 用户选择部署目标 (Library/Global/Project) |
| 3 | **Library**: 调用 `libraryService.organize()` 移动技能 |
| 4 | **Global**: 调用 `startDeploy(skills, { targetScope: 'global' })` |
| 5 | **Project**: 调用 `startDeploy(skills, { targetScope: 'project', projectId })` |
| 6 | `useBatchDeploy` hook 处理批量部署 |
| 7 | 完成后显示结果，支持重试失败项 |

**数据流转**：

```
SkillCard.onDeploy(skill)
    ↓
setDeploySkills([skill]), setShowDeployTargetDialog(true)
    ↓
BatchDeployTargetDialog.onDeploy(target)
    ↓
根据 target.type 分流:
    │
    ├─ 'library' → libraryService.organize(skillId, groupId, categoryId)
    │
    ├─ 'global' → useBatchDeploy.startDeploy(skills, { targetScope: 'global' })
    │                    ↓
    │              循环: IPC('deploy_to_global' | 'deploy_to_global_for_ide')
    │
    └─ 'project' → useBatchDeploy.startDeploy(skills, { targetScope: 'project', projectId })
                         ↓
                   循环: IPC('deploy_to_project' | 'deploy_to_project_for_ide')
    ↓
BatchDeployDialog 显示进度和结果
```

---

### 3.5 冲突解决链路

**链路名称**：Conflict Resolution

**触发条件**：iCloud 同步产生冲突 → 显示冲突横幅 → 点击打开 ConflictDialog

**执行步骤**：

| 步骤 | 操作 |
|------|------|
| 1 | `useOfflineSync` hook 初始化时调用 `checkConflicts()` |
| 2 | 调用 `icloudService.getConflicts()` 获取冲突列表 |
| 3 | 如果 `conflicts.length > 0`，显示冲突横幅 |
| 4 | 用户点击横幅，`setShowConflictDialog(true)` 打开对话框 |
| 5 | 用户选择解决方案 |
| 6 | 调用 `handleResolveConflict(skillId, resolution)` |
| 7 | 成功后刷新技能列表，显示成功 toast |

**数据流转**：

```
useOfflineSync 初始化
    ↓
icloudService.getConflicts() → IPC('icloud_get_conflicts')
    ↓
setConflicts(result.data) → conflicts 数组
    ↓
hasConflicts = true → 显示冲突横幅
    ↓
用户点击横幅 → setShowConflictDialog(true)
    ↓
ConflictDialog.onResolve(skillId, resolution)
    ↓
icloudService.resolveConflict(skillId, resolution) → IPC('icloud_resolve_conflict')
    ↓
setConflicts(prev => prev.filter(...)) → 移除已解决冲突
    ↓
libraryService.list() → 刷新 skills
```

---

## 4. 组件结构

```
Library.tsx (页面入口)
├── SkillListLayout (布局容器)
│   ├── SkillListHeader (标题栏 + 搜索 + 排序 + Import 按钮)
│   ├── Error Block (错误显示)
│   ├── Conflict Banner (冲突提示横幅)
│   └── SkillList (技能列表)
│       └── SkillCard[] (技能卡片，带 actions)
├── SkillPreviewModal (技能详情预览)
├── ImportDialog (导入对话框)
├── ImportProgress (导入进度)
├── ExportDialog (导出对话框)
├── ExportProgress (导出进度)
├── BatchDeployTargetDialog (部署目标选择)
├── BatchDeployDialog (部署进度)
└── ConflictDialog (冲突解决)
```

---

## 5. 数据流

### Store 调用关系

```
┌─────────────────────────────────────────────────────────────┐
│                      Library.tsx                             │
├─────────────────────────────────────────────────────────────┤
│  useLibraryStore                                             │
│  ├── skills: LibrarySkill[]         ← libraryService.list() │
│  ├── selectedSkill: LibrarySkill    ← handleSelectSkill()   │
│  ├── selectedGroupId: string        ← Sidebar 选择          │
│  ├── selectedCategoryId: string     ← Sidebar 选择          │
│  ├── isLoading: boolean             ← setLoading()          │
│  ├── error: string                  ← setError()            │
│  ├── importProgress: ImportProgress ← import actions        │
│  └── exportProgress: ExportProgress ← export actions        │
├─────────────────────────────────────────────────────────────┤
│  useUIStore                                                  │
│  ├── showToast()                    ← 操作结果反馈          │
│  └── showConfirmDialog()            ← 删除确认              │
└─────────────────────────────────────────────────────────────┘
```

### Service 调用映射

| Service 方法 | IPC 通道 | 用途 |
|--------------|----------|------|
| `libraryService.list()` | `library_list` | 获取技能列表 |
| `libraryService.get(id)` | `library_get` | 获取技能详情 |
| `libraryService.import()` | `library_import` | 导入技能 |
| `libraryService.export()` | `library_export` | 导出技能 |
| `libraryService.delete()` | `library_delete` | 删除技能 |
| `libraryService.organize()` | `library_organize` | 移动技能分类 |

### Hook 职责划分

| Hook | 职责 |
|------|------|
| `useLibraryFilters` | 搜索、排序、分组/分类过滤 |
| `useBatchDeploy` | 批量部署状态管理、队列处理、取消/重试 |
| `useSidebarData` | 刷新 Library/Global/Projects 数据 |
| `useSkillActions` | 通用操作：复制路径、在 Finder 中显示 |
| `useLibraryDialogs` | 对话框显示状态管理 |
| `useLibraryExport` | 导出逻辑和进度管理 |
| `useLibraryImport` | 导入逻辑和进度管理 |
| `useOfflineSync` | iCloud 同步状态、冲突检测、离线队列 |

---

## 6. IPC 通道汇总

| 通道 | 用途 | 调用位置 |
|------|------|----------|
| `library_list` | 获取 Library 技能列表 | libraryService.list() |
| `library_get` | 获取单个技能详情 | libraryService.get() |
| `library_delete` | 删除 Library Skill | libraryService.delete() |
| `library_import` | 导入技能到 Library | libraryService.import() |
| `library_export` | 导出技能 | libraryService.export() |
| `library_organize` | 组织技能分类 | libraryService.organize() |
| `icloud_get_conflicts` | 获取冲突列表 | icloudService.getConflicts() |
| `icloud_resolve_conflict` | 解决冲突 | icloudService.resolveConflict() |
