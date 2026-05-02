# Global 页面 Wiki

## 1. 页面基础信息

| 属性 | 值 |
|------|------|
| **页面名称** | Global |
| **路由路径** | `/global` |
| **主要功能** | 管理全局安装的技能 |
| **核心职责** | 显示、搜索、排序、删除、导出、部署 Global Skills |
| **数据源** | `~/.claude/skills/` 目录 (通过 Tauri 后端访问) |
| **源文件** | `src/pages/Global/Global.tsx` |

---

## 2. 初始化加载链路

### 链路名称：页面初始化加载

**触发条件**：组件挂载 (`useEffect` 第 72-90 行)

**执行步骤**：

| 步骤 | 操作 | 代码位置 |
|------|------|----------|
| 1 | 设置 `isLoading = true` | Global.tsx:74 |
| 2 | 调用 `globalService.list()` | Global.tsx:76 |
| 3 | 后端执行 `global_list` IPC 命令 | globalService.ts:5 |
| 4 | 接收响应结果 | Global.tsx:77 |
| 5 | 成功时: `setSkills(result.data)` | Global.tsx:78 |
| 6 | 失败时: `setError(result.error.message)` | Global.tsx:80 |
| 7 | 设置 `isLoading = false` | Global.tsx:85 |

**数据流转**：

```
Component Mount
     │
     ▼
globalStore.setLoading(true)
     │
     ▼
globalService.list() ─────► IPC: 'global_list'
     │                              │
     ▼                              ▼
{ success, data }              { success: false, error }
     │                              │
     ▼                              ▼
globalStore.setSkills(data)    globalStore.setError(message)
     │                              │
     └──────────────────────────────┘
                    │
                    ▼
         globalStore.setLoading(false)
                    │
                    ▼
         useSkillFilter() 处理 skills
                    │
                    ▼
         SkillList 渲染 filteredSkills
```

**异常处理**：

| 异常类型 | 处理方式 |
|----------|----------|
| IPC 返回失败 | 设置 `error` 状态，页面显示错误信息 |
| JavaScript 异常 | catch 块捕获，设置通用错误消息 |
| skills 数组无效 | useSkillFilter 内部检查 `Array.isArray`，返回空数组 |

---

## 3. 核心业务操作链路

### 3.1 刷新技能列表链路

**链路名称**：Refresh Skills

**触发条件**：点击刷新按钮 (`handleRefresh` 第 92-111 行)

**执行步骤**：

| 步骤 | 操作 | 代码位置 |
|------|------|----------|
| 1 | 设置 `isRefreshing = true` | Global.tsx:93 |
| 2 | 调用 `globalService.list()` | Global.tsx:95 |
| 3 | 成功时: 更新 skills + 设置 lastRefreshAt | Global.tsx:97-99 |
| 4 | 成功时: 显示 toast "Global skills refreshed" | Global.tsx:99 |
| 5 | 失败时: 设置 error + 显示错误 toast | Global.tsx:101-107 |
| 6 | 设置 `isRefreshing = false` | Global.tsx:109 |

**数据流转**：

```
Click Refresh Button
        │
        ▼
globalStore.setRefreshing(true)
        │
        ▼
globalService.list() ─────► IPC: 'global_list'
        │
        ▼
    成功/失败分支
        │
   ┌────┴────┐
   ▼         ▼
 成功       失败
   │         │
   ▼         ▼
setSkills   setError + showToast('error')
setLastRefreshAt(new Date())
showToast('success')
   │         │
   └─────────┘
        │
        ▼
globalStore.setRefreshing(false)
```

---

### 3.2 删除技能链路

**链路名称**：Delete Skill

**触发条件**：点击技能卡片删除按钮 (`handleDeleteSkill` 第 141-177 行)

**执行步骤**：

| 步骤 | 操作 | 代码位置 |
|------|------|----------|
| 1 | 显示确认对话框 (`showConfirmDialog`) | Global.tsx:144-148 |
| 2 | 用户确认后关闭对话框 | Global.tsx:150 |
| 3 | 设置 `isLoading = true` | Global.tsx:151 |
| 4 | 调用 `globalService.delete(skillId)` | Global.tsx:153 |
| 5 | 成功时: `removeSkill(skillId)` 更新 store | Global.tsx:155 |
| 6 | 成功时: 清除选中状态 (如当前选中) | Global.tsx:156-158 |
| 7 | 成功时: 刷新 sidebar 计数 (`refreshGlobal()`) | Global.tsx:161 |
| 8 | 成功时: 显示 toast "Global skill deleted" | Global.tsx:159 |
| 9 | 失败时: 设置 error + 显示错误 toast | Global.tsx:163-169 |
| 10 | 设置 `isLoading = false` | Global.tsx:171 |

**数据流转**：

```
Click Delete Button
        │
        ▼
uiStore.showConfirmDialog()
        │
        ▼
    用户操作
   ┌────┴────┐
   ▼         ▼
 取消       确认
   │         │
   ▼         ▼
closeDialog  closeDialog + setLoading(true)
             │
             ▼
         globalService.delete(id) ─────► IPC: 'global_delete'
             │
             ▼
         成功/失败分支
        ┌────┴────┐
        ▼         ▼
      成功       失败
        │         │
        ▼         ▼
   removeSkill   setError + showToast('error')
   清除选中状态
   refreshGlobal() (更新 sidebar)
   showToast('success')
        │         │
        └─────────┘
             │
             ▼
      setLoading(false)
```

---

### 3.3 导出技能链路

**链路名称**：Export Skill

**触发条件**：点击技能卡片导出按钮 (`handleExportSkill` 第 190-193 行)

**执行步骤**：

| 步骤 | 操作 | 代码位置 |
|------|------|----------|
| 1 | 设置 `exportSkills` 数组 | Global.tsx:191 |
| 2 | 打开导出对话框 (`setShowExportDialog(true)`) | Global.tsx:192 |
| 3 | 用户选择格式和目标 | ExportDialog 组件 |
| 4 | 调用 `handleExportStart` | Global.tsx:196-209 |
| 5 | 动态导入 `libraryService` | Global.tsx:198 |
| 6 | 调用 `libraryService.exportFromPath()` | Global.tsx:200 |
| 7 | 显示结果 toast | Global.tsx:201-205 |

**数据流转**：

```
Click Export Button
        │
        ▼
setExportSkills([{ id, name, path, scope: 'global' }])
        │
        ▼
setShowExportDialog(true)
        │
        ▼
    ExportDialog 组件
        │
        ▼
用户选择格式
        │
        ▼
handleExportStart(format, skills)
        │
        ▼
动态导入 libraryService
        │
        ▼
libraryService.exportFromPath(path, name, format)
        │                              │
        ▼                              ▼
    成功                          失败
        │                              │
        ▼                              ▼
showToast('success', 'Exported')  showToast('error', message)
```

---

### 3.4 部署技能链路

**链路名称**：Deploy Skill

**触发条件**：点击技能卡片部署按钮 (`handleDeploySkill` 第 217-220 行)

**执行步骤**：

| 步骤 | 操作 | 代码位置 |
|------|------|----------|
| 1 | 设置 `deploySkill` 状态 | Global.tsx:218 |
| 2 | 打开目标选择对话框 | Global.tsx:219 |
| 3 | 用户选择目标 (Library/Project) | BatchDeployTargetDialog |
| 4 | 调用 `handleDeployTarget` | Global.tsx:222-255 |
| 5 | **Library 目标**: 调用 `libraryService.import()` | Global.tsx:229 |
| 6 | **Project 目标**: 调用 `startDeploy()` | Global.tsx:245-252 |
| 7 | 显示结果/进度对话框 | BatchDeployDialog |

**数据流转**：

```
Click Deploy Button
        │
        ▼
setDeploySkill(skill)
        │
        ▼
setShowDeployTargetDialog(true)
        │
        ▼
    BatchDeployTargetDialog
        │
        ▼
用户选择目标
        │
   ┌────┴────────────┐
   ▼                 ▼
 Library            Project
   │                 │
   ▼                 ▼
libraryService.import()   startDeploy([skill], options)
   │                       │
   ▼                       ▼
成功/失败            useBatchDeploy 处理队列
   │                       │
   ▼                       ▼
refreshLibrary()     IPC: 'deploy_from_global'
showToast()          (逐个部署)
                           │
                           ▼
                    BatchDeployDialog 显示进度
                           │
                           ▼
                    完成/失败/取消
                           │
                           ▼
                    showToast() 结果提示
```

---

## 4. 组件结构

| 组件 | 职责 | 来源 |
|------|------|------|
| `SkillListLayout` | 页面布局容器 | `components/features/SkillList` |
| `SkillListHeader` | 标题、搜索、排序、刷新按钮 | `components/features/SkillList` |
| `SkillList` | 技能列表渲染 (Grid/List 模式) | `components/features/SkillList` |
| `SkillPreviewModal` | 技能详情预览弹窗 | `components/features/SkillPreviewModal` |
| `ExportDialog` | 导出格式选择对话框 | `components/features/ExportDialog` |
| `BatchDeployTargetDialog` | 部署目标选择对话框 | `components/features/DeploymentTracking` |
| `BatchDeployDialog` | 部署进度和结果对话框 | `components/features/DeploymentTracking` |

---

## 5. 数据流

### Store 调用关系

```
Global.tsx
    │
    ├── globalStore (主数据源)
    │       ├── skills: GlobalSkill[]
    │       ├── selectedSkill: GlobalSkill | null
    │       ├── isLoading: boolean
    │       ├── isRefreshing: boolean
    │       └── error: string | null
    │
    ├── projectStore (辅助数据)
    │       └── projects: Project[] (用于部署目标选择)
    │
    ├── uiStore (交互状态)
    │       ├── showToast()
    │       ├── showConfirmDialog()
    │       └── closeConfirmDialog()
    │
    └── useSidebarData (sidebar 刷新)
            └── refreshGlobal() → 更新 sidebar 计数
            └── refreshLibrary() → 部署到 Library 后刷新
```

### Service 调用关系

```
Global.tsx
    │
    ├── globalService
    │       ├── list() → IPC: 'global_list'
    │       ├── get(id) → IPC: 'global_get' (获取 skill.md 内容)
    │       └── delete(id) → IPC: 'global_delete'
    │
    ├── libraryService (动态导入)
    │       ├── exportFromPath() → IPC: 'library_export_from_path'
    │       └── import() → IPC: 'library_import'
    │
    └── configService (useSkillActions 内部)
            └── revealPath() → IPC: 'config_reveal_path'
```

### Hook 职责分工

| Hook | 职责 | 输入 | 输出 |
|------|------|------|------|
| `useSkillFilter` | 搜索和排序 | `skills`, `options` | `filteredSkills`, 搜索/排序状态 |
| `useSkillActions` | 通用操作 | `scope`, `skills` | `onCopyPath`, `onReveal` |
| `useBatchDeploy` | 批量部署逻辑 | 无 | `startDeploy`, `status`, `progress` |
| `useSidebarData` | Sidebar 刷新 | 无 | `refreshGlobal`, `refreshLibrary` |

---

## 6. IPC 通道汇总

| 通道 | 用途 | 调用位置 |
|------|------|----------|
| `global_list` | 获取 Global Skills 列表 | globalService.list() |
| `global_get` | 获取单个技能详情 | globalService.get() |
| `global_delete` | 删除 Global Skill | globalService.delete() |
| `library_export_from_path` | 从路径导出技能 | libraryService.exportFromPath() |
| `library_import` | 导入技能到 Library | libraryService.import() |
| `deploy_from_global` | 从 Global 部署到 Project | useBatchDeploy.deploySkill() |
| `config_reveal_path` | 在 Finder 中显示 | configService.revealPath() |
