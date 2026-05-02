# Zustand 状态管理架构 Wiki

## 1. Store 架构概览

### 1.1 Zustand 配置

项目采用 Zustand 作为状态管理解决方案，核心配置如下：

| 配置项 | 说明 |
|--------|------|
| 创建方式 | `create<State>()(middleware)` |
| 中间件链 | `devtools(persist(store))` |
| 开发工具 | 全局启用 Redux DevTools |
| TypeScript | 完整类型支持，State 和 Actions 分离定义 |

### 1.2 持久化策略

项目采用 **选择性持久化** 策略，通过 `partialize` 函数仅持久化必要状态：

| Store | 持久化 | 存储位置 | 持久化字段 |
|-------|--------|----------|------------|
| `libraryStore` | 是 | localStorage | `groups` |
| `globalStore` | 否 | - | - |
| `projectStore` | 是 | localStorage | `projects` |
| `settingsStore` | 是 | localStorage | `theme`, `language`, `autoUpdateCheck`, `autoRefreshInterval`, `defaultImportCategory` |
| `uiStore` | 是 | localStorage | `viewMode` |
| `selectionStore` | 否 | - | - |
| `ideStore` | 否 | - | - |
| `updateStore` | 否 | - | - |

### 1.3 中间件使用

```typescript
// 标准中间件链
devtools(
  persist(
    (set, get) => ({ /* store implementation */ }),
    { name: 'store-name', partialize: (state) => ({ ... }) }
  ),
  { name: 'devtools-name' }
)
```

**中间件说明：**

- **devtools**: 所有 Store 统一启用，便于调试追踪状态变化
- **persist**: 仅持久化需要跨会话保持的状态
- **createJSONStorage**: 显式使用 `localStorage`，确保浏览器兼容性

---

## 2. Store 模块分析

### 2.1 libraryStore - App Library 技能管理

**文件路径**: `/src/stores/libraryStore.ts`

#### 状态字段

| 字段 | 类型 | 说明 | 持久化 |
|------|------|------|--------|
| `skills` | `LibrarySkill[]` | Library 中的所有技能 | 否 |
| `groups` | `Group[]` | 技能分组 | **是** |
| `selectedSkill` | `LibrarySkill \| null` | 当前选中的技能 | 否 |
| `selectedGroupId` | `string \| undefined` | 当前选中的分组 ID | 否 |
| `selectedCategoryId` | `string \| undefined` | 当前选中的分类 ID | 否 |
| `isLoading` | `boolean` | 加载状态 | 否 |
| `error` | `string \| null` | 错误信息 | 否 |
| `importProgress` | `ImportProgress` | 导入进度 | 否 |
| `exportProgress` | `ExportProgress` | 导出进度 | 否 |

#### Actions 方法

**技能操作：**
- `setSkills(skills)` - 设置技能列表
- `addSkill(skill)` - 添加技能
- `removeSkill(id)` - 移除技能
- `updateSkill(id, updates)` - 更新技能
- `selectSkill(skill)` - 选择技能

**分组/分类操作：**
- `setGroups(groups)` - 设置分组
- `addGroup(group)` - 添加分组
- `updateGroup(id, updates)` - 更新分组
- `removeGroup(id)` - 移除分组
- `addCategory(groupId, category)` - 添加分类
- `updateCategory(groupId, categoryId, updates)` - 更新分类
- `removeCategory(groupId, categoryId)` - 移除分类

**部署操作：**
- `updateDeployments(skillId, deployments)` - 更新部署记录
- `addDeployment(skillId, deployment)` - 添加部署
- `removeDeployment(skillId, deploymentId)` - 移除部署

**导入导出操作：**
- `startImport/Export(total)` - 开始导入/导出
- `updateImport/ExportProgress(current, skillName)` - 更新进度
- `completeImport/Export(...)` - 完成
- `cancelImport/Export()` - 取消
- `resetImport/Export()` - 重置

---

### 2.2 globalStore - Global Skills 管理

**文件路径**: `/src/stores/globalStore.ts`

#### 状态字段

| 字段 | 类型 | 说明 | 持久化 |
|------|------|------|--------|
| `skills` | `GlobalSkill[]` | 全局安装的技能列表 | 否 |
| `selectedSkill` | `GlobalSkill \| null` | 当前选中的技能 | 否 |
| `isLoading` | `boolean` | 加载状态 | 否 |
| `isRefreshing` | `boolean` | 刷新状态 | 否 |
| `error` | `string \| null` | 错误信息 | 否 |

#### Actions 方法

- `setSkills(skills)` - 设置技能列表
- `addSkill(skill)` - 添加技能
- `removeSkill(id)` - 移除技能（同时清除选中状态）
- `selectSkill(skill)` - 选择技能
- `setLoading(loading)` - 设置加载状态
- `setRefreshing(refreshing)` - 设置刷新状态
- `setError(error)` - 设置错误
- `reset()` - 重置 Store

---

### 2.3 projectStore - Project Skills 管理

**文件路径**: `/src/stores/projectStore.ts`

#### 状态字段

| 字段 | 类型 | 说明 | 持久化 |
|------|------|------|--------|
| `projects` | `Project[]` | 监控的项目列表 | **是** |
| `selectedProject` | `Project \| null` | 当前选中的项目 | 否 |
| `projectSkills` | `Map<string, ProjectSkill[]>` | 项目技能映射 | 否 |
| `isLoading` | `boolean` | 加载状态 | 否 |
| `isRefreshing` | `boolean` | 刷新状态 | 否 |
| `refreshingProjectId` | `string \| null` | 正在刷新的项目 ID | 否 |
| `lastRefreshAt` | `Map<string, Date>` | 最后刷新时间 | 否 |
| `refreshError` | `string \| null` | 刷新错误 | 否 |
| `error` | `string \| null` | 错误信息 | 否 |

#### Actions 方法

**项目操作：**
- `setProjects(projects)` - 设置项目列表
- `addProject(project)` - 添加项目
- `removeProject(id)` - 移除项目（同时清理关联数据）

**技能操作：**
- `setProjectSkills(projectId, skills)` - 设置项目技能
- `clearProjectSkills(projectId)` - 清除项目技能

**状态操作：**
- `selectProject(project)` - 选择项目
- `setLoading(loading)` - 设置加载状态
- `setRefreshing(refreshing, projectId?)` - 设置刷新状态
- `setRefreshError(error)` - 设置刷新错误
- `setError(error)` - 设置错误
- `reset()` - 重置 Store

---

### 2.4 settingsStore - 应用设置

**文件路径**: `/src/stores/settingsStore.ts`

#### 状态字段

| 字段 | 类型 | 默认值 | 持久化 |
|------|------|--------|--------|
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | **是** |
| `language` | `'auto' \| 'en' \| 'zh-CN'` | `'auto'` | **是** |
| `autoUpdateCheck` | `boolean` | `true` | **是** |
| `autoRefreshInterval` | `number` | `5` | **是** |
| `defaultImportCategory` | `string \| undefined` | `undefined` | **是** |
| `_initialized` | `boolean` | `false` | 否 |

#### Actions 方法

- `setTheme(theme)` - 设置主题（同步到后端）
- `setLanguage(language)` - 设置语言（同步到后端）
- `setAutoUpdateCheck(enabled)` - 设置自动更新检查
- `setAutoRefreshInterval(interval)` - 设置自动刷新间隔
- `setDefaultImportCategory(categoryId)` - 设置默认导入分类
- `initializeFromBackend()` - 从后端初始化设置
- `reset()` - 重置设置

#### 特点

- **双向同步**: 所有设置变更自动同步到后端 `storageService`
- **初始化保护**: `_initialized` 标志防止重复初始化
- **后端优先**: 启动时从后端加载配置，确保一致性

---

### 2.5 uiStore - UI 状态管理

**文件路径**: `/src/stores/uiStore.ts`

#### 状态字段

| 字段 | 类型 | 说明 | 持久化 |
|------|------|------|--------|
| `sidebarState` | `'expanded' \| 'collapsed'` | 侧边栏状态 | 否 |
| `activeView` | `'library' \| 'global' \| 'project' \| 'settings'` | 当前视图 | 否 |
| `viewMode` | `'grid' \| 'list'` | 视图模式 | **是** |
| `toasts` | `Toast[]` | Toast 通知列表 | 否 |
| `confirmDialog` | `ConfirmDialog \| null` | 确认对话框 | 否 |
| `search` | `SearchUIState` | 搜索 UI 状态 | 否 |

#### Actions 方法

**UI 操作：**
- `toggleSidebar()` / `setSidebarState(state)` - 侧边栏控制
- `setActiveView(view)` - 设置当前视图
- `setViewMode(mode)` - 设置视图模式

**Toast 操作：**
- `showToast(type, message, duration?)` - 显示 Toast（自动消失）
- `dismissToast(id)` - 手动关闭 Toast

**对话框操作：**
- `showConfirmDialog(options)` - 显示确认对话框
- `closeConfirmDialog()` - 关闭对话框

**搜索操作 (searchActions)：**
- `openSearch()` / `closeSearch()` - 打开/关闭搜索
- `setSearchQuery(query)` - 设置查询
- `setSearchScope(scope)` - 设置范围
- `setSearchResults(results)` - 设置结果
- `setSearching(searching)` - 设置搜索状态
- `toggleGroupCollapse(groupId)` - 切换组折叠
- `resetSearch()` - 重置搜索

---

### 2.6 selectionStore - 统一选择状态

**文件路径**: `/src/stores/selectionStore.ts`

#### 状态字段

| 字段 | 类型 | 说明 | 持久化 |
|------|------|------|--------|
| `source` | `SelectionSource` | 当前选择来源 | 否 |
| `libraryGroupId` | `string \| undefined` | Library 分组 ID | 否 |
| `libraryCategoryId` | `string \| undefined` | Library 分类 ID | 否 |
| `projectId` | `string \| null` | Project ID | 否 |

#### SelectionSource 类型

```typescript
type SelectionSource = 'library' | 'global' | 'project' | 'none';
```

#### Actions 方法

- `selectLibrary(groupId?, categoryId?)` - 选择 Library
- `selectGlobal()` - 选择 Global
- `selectProject(projectId)` - 选择 Project
- `clearSelection()` - 清除所有选择

#### 派生状态方法

- `isLibrarySelected()` - 是否选中 Library
- `isGlobalSelected()` - 是否选中 Global
- `isProjectSelected()` - 是否选中 Project

#### 设计目的

解决原有选择逻辑分散在多个组件中使用 `useEffect` 副作用的问题，提供 **互斥选择** 的统一管理。

---

### 2.7 ideStore - IDE 配置管理

**文件路径**: `/src/stores/ideStore.ts`

#### 状态字段

| 字段 | 类型 | 说明 | 持久化 |
|------|------|------|--------|
| `ideConfigs` | `IDEConfig[]` | IDE 配置列表 | 否 |
| `activeIdeId` | `string` | 当前激活的 IDE ID | 否 |
| `isLoading` | `boolean` | 加载状态 | 否 |
| `error` | `string \| null` | 错误信息 | 否 |

#### Actions 方法

- `setIDEConfigs(configs)` - 设置配置列表
- `setActiveIDE(ideId)` - 设置激活 IDE
- `addIDE(config)` - 添加 IDE
- `removeIDE(ideId)` - 移除 IDE
- `updateIDE(ideId, updates)` - 更新 IDE
- `setLoading(loading)` - 设置加载状态
- `setError(error)` - 设置错误
- `getActiveIDE()` - 获取当前激活的 IDE 配置
- `reset()` - 重置 Store

---

### 2.8 updateStore - 自动更新状态

**文件路径**: `/src/stores/updateStore.ts`

#### 状态字段

| 字段 | 类型 | 说明 | 持久化 |
|------|------|------|--------|
| `updateAvailable` | `boolean` | 是否有可用更新 | 否 |
| `latestVersion` | `string \| null` | 最新版本号 | 否 |
| `releaseNotes` | `string \| null` | 更新说明 | 否 |
| `downloadProgress` | `number` | 下载进度 (0-100) | 否 |
| `isDownloading` | `boolean` | 下载中状态 | 否 |
| `isInstalling` | `boolean` | 安装中状态 | 否 |
| `error` | `string \| null` | 错误信息 | 否 |

#### Actions 方法

- `setUpdateAvailable(available, version?, notes?)` - 设置更新可用状态
- `setDownloadProgress(progress)` - 设置下载进度
- `setDownloading(downloading)` - 设置下载状态
- `setInstalling(installing)` - 设置安装状态
- `setError(error)` - 设置错误
- `reset()` - 重置 Store

---

## 3. Store 依赖关系图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Store 依赖关系                                 │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │  selectionStore  │ ← 统一选择协调者
                    │   (无持久化)      │
                    └────────┬─────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ libraryStore │  │ globalStore  │  │ projectStore │
    │  (持久化:     │  │  (无持久化)   │  │  (持久化:     │
    │   groups)    │  │              │  │   projects)  │
    └──────┬───────┘  └──────────────┘  └──────┬───────┘
           │                                    │
           │         部署关系                    │
           └────────────────────────────────────┘
                    deploySkill()

┌─────────────────────────────────────────────────────────────────────────┐
│                          独立 Store                                      │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │settingsStore │  │   uiStore    │  │  ideStore    │  │ updateStore  │
    │ (持久化:全部) │  │ (持久化:      │  │  (无持久化)   │  │  (无持久化)   │
    │              │  │  viewMode)   │  │              │  │              │
    └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
           │
           ▼
    storageService.setSettings() ← 双向同步到后端
```

### 协作关系说明

1. **selectionStore 作为统一选择协调者**
   - 选择 Library 时: 清除 Global/Project 选择，同步到 libraryStore
   - 选择 Global 时: 清除 Library/Project 选择
   - 选择 Project 时: 清除 Library/Global 选择，同步到 projectStore

2. **libraryStore 与 projectStore 的部署关系**
   - 部署技能后: libraryStore 更新 deployments
   - 部署技能后: projectStore 刷新项目技能列表

3. **settingsStore 与后端的双向同步**
   - 任何设置变更: 自动调用 storageService.setSettings()
   - 应用启动: 调用 initializeFromBackend() 从后端加载

---

## 4. 选择器模式

### 4.1 推荐的选择器用法

```typescript
// ✅ 正确: 单字段选择器，最小化重渲染
const skills = useLibraryStore((state) => state.skills);
const isLoading = useLibraryStore((state) => state.isLoading);
const setSkills = useLibraryStore((state) => state.setSkills);

// ✅ 正确: 批量选择相关字段
const { skills, selectedSkill } = useLibraryStore((state) => ({
  skills: state.skills,
  selectedSkill: state.selectedSkill,
}));

// ✅ 正确: 仅选择 Actions（不会因状态变化重渲染）
const actions = useLibraryStore((state) => ({
  setSkills: state.setSkills,
  addSkill: state.addSkill,
  removeSkill: state.removeSkill,
}));

// ❌ 错误: 选择整个 Store
const store = useLibraryStore(); // 任何状态变化都会触发重渲染
```

### 4.2 在组件外使用 Store

```typescript
// 获取状态
const skills = useLibraryStore.getState().skills;

// 调用 Actions
useLibraryStore.getState().addSkill(newSkill);

// 订阅状态变化
const unsubscribe = useLibraryStore.subscribe((state) => {
  console.log('Skills updated:', state.skills);
});

// 取消订阅
unsubscribe();
```

### 4.3 Hook 封装模式

项目采用 Hook 封装 Store 逻辑，提供更清晰的 API：

| Hook | 封装的 Store | 用途 |
|------|--------------|------|
| `useSelection` | `selectionStore`, `libraryStore`, `projectStore` | 统一选择逻辑 |
| `useSkillFilter` | 无 Store 依赖 | 技能过滤和排序（纯本地状态） |
| `useBatchDeploy` | `libraryStore`, `globalStore`, `projectStore` | 批量部署逻辑 |
| `useSearch` | `uiStore` | 搜索逻辑 |
| `useAutoUpdate` | `updateStore` | 自动更新逻辑 |

---

## 5. 设计特点总结

1. **模块化分离**: 每个 Store 职责单一，便于维护和测试
2. **选择性持久化**: 仅持久化必要状态，避免性能问题
3. **统一选择协调**: `selectionStore` 解决多 Store 互斥选择问题
4. **双向同步**: `settingsStore` 与后端保持同步
5. **Hook 封装**: 复杂逻辑通过 Hook 封装，提供更清晰的 API

### 持久化策略总结

| 持久化级别 | Store | 原因 |
|------------|-------|------|
| 全量持久化 | `settingsStore` | 用户配置需跨会话保持 |
| 选择性持久化 | `libraryStore`, `projectStore`, `uiStore` | 仅持久化核心数据 |
| 无持久化 | `globalStore`, `selectionStore`, `ideStore`, `updateStore` | 运行时状态，无需持久化 |
