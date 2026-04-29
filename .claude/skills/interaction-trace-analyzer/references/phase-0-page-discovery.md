# Phase 0: Page Discovery

页面发现是分析的第一步，目标是找出应用中所有可访问的页面/路由。

## 目标

在开始分析任何交互之前，必须先了解应用的完整页面结构。这确保了分析的完整性——不会遗漏任何页面。

## 执行流程

```
Main Agent
    │
    ▼
Create Page Discovery Agent
    │
    ▼
Page Discovery Agent scans router/config
    │
    ▼
Return Complete Page Inventory
    │
    ▼
Main Agent receives page list
    │
    ▼
Initialize analysis loop
```

## 输出格式

```json
{
  "application_name": "string",
  "scan_timestamp": "ISO timestamp",
  "pages": [
    {
      "id": "page-id",
      "name": "Page Name",
      "route": "/path",
      "component_path": "src/pages/PageName/PageName.tsx",
      "layout": "MainLayout | None",
      "children_pages": ["child-page-ids"],
      "entry_points": ["navigation links that lead to this page"]
    }
  ],
  "total_pages": number,
  "navigation_structure": {
    "root_pages": ["page-ids"],
    "nested_pages": {
      "parent_id": ["child_ids"]
    }
  }
}
```

## 详细案例

### 案例 1: React Router 应用

**场景**: 分析一个使用 React Router 的 Tauri 应用

**步骤**:

1. **定位路由配置文件**
   - 查找 `src/router/index.tsx` 或 `src/App.tsx`
   - 搜索 `<Route` 或 `createBrowserRouter` 等关键字

2. **解析路由结构**
   ```tsx
   // 假设找到以下路由配置
   const router = createBrowserRouter([
     { path: "/", element: <Library /> },
     { path: "/global", element: <GlobalSkills /> },
     { path: "/settings", element: <Settings /> },
     { path: "/project/:id", element: <ProjectDetail /> }
   ]);
   ```

3. **产出页面清单**
   ```json
   {
     "application_name": "Open Skills Manager",
     "scan_timestamp": "2026-04-29T09:00:00Z",
     "pages": [
       {
         "id": "library",
         "name": "Library",
         "route": "/",
         "component_path": "src/pages/Library/Library.tsx",
         "layout": "MainLayout",
         "children_pages": [],
         "entry_points": ["sidebar-library-link", "app-startup"]
       },
       {
         "id": "global",
         "name": "Global Skills",
         "route": "/global",
         "component_path": "src/pages/GlobalSkills/GlobalSkills.tsx",
         "layout": "MainLayout",
         "children_pages": [],
         "entry_points": ["sidebar-global-link"]
       },
       {
         "id": "settings",
         "name": "Settings",
         "route": "/settings",
         "component_path": "src/pages/Settings/Settings.tsx",
         "layout": "MainLayout",
         "children_pages": [],
         "entry_points": ["sidebar-settings-link"]
       },
       {
         "id": "project-detail",
         "name": "Project Detail",
         "route": "/project/:id",
         "component_path": "src/pages/ProjectDetail/ProjectDetail.tsx",
         "layout": "MainLayout",
         "children_pages": [],
         "entry_points": ["project-card-click"]
       }
     ],
     "total_pages": 4,
     "navigation_structure": {
       "root_pages": ["library", "global", "settings", "project-detail"],
       "nested_pages": {}
     }
   }
   ```

### 案例 2: 动态路由处理

**场景**: 路由包含动态参数

**输入**:
```tsx
{ path: "/project/:id", element: <ProjectDetail /> },
{ path: "/skill/:skillId/version/:versionId", element: <SkillVersion /> }
```

**处理方式**:
- 动态参数用占位符表示
- 记录参数名称用于后续分析
- 在 `entry_points` 中标注哪些交互会触发导航到该页面

**输出**:
```json
{
  "id": "project-detail",
  "name": "Project Detail",
  "route": "/project/:id",
  "route_params": ["id"],
  "component_path": "src/pages/ProjectDetail/ProjectDetail.tsx",
  "entry_points": [
    "click on project card in Library page",
    "click on project name in sidebar"
  ]
}
```

### 案例 3: 嵌套布局处理

**场景**: 页面使用嵌套布局

**输入**:
```tsx
<Route path="/" element={<MainLayout />}>
  <Route index element={<Library />} />
  <Route path="settings" element={<Settings />}>
    <Route path="general" element={<GeneralSettings />} />
    <Route path="sync" element={<SyncSettings />} />
  </Route>
</Route>
```

**输出**:
```json
{
  "pages": [
    {
      "id": "library",
      "name": "Library",
      "route": "/",
      "layout": "MainLayout",
      "children_pages": []
    },
    {
      "id": "settings",
      "name": "Settings",
      "route": "/settings",
      "layout": "MainLayout",
      "children_pages": ["settings-general", "settings-sync"]
    },
    {
      "id": "settings-general",
      "name": "General Settings",
      "route": "/settings/general",
      "layout": "MainLayout > SettingsLayout",
      "children_pages": []
    },
    {
      "id": "settings-sync",
      "name": "Sync Settings",
      "route": "/settings/sync",
      "layout": "MainLayout > SettingsLayout",
      "children_pages": []
    }
  ],
  "navigation_structure": {
    "root_pages": ["library", "settings"],
    "nested_pages": {
      "settings": ["settings-general", "settings-sync"]
    }
  }
}
```

## 常见错误

### ❌ 错误 1: 遗漏动态路由
只发现静态路由，忽略了带参数的路由。

**正确做法**: 使用正则或 AST 解析找出所有 `<Route>` 元素，包括带 `:param` 的路由。

### ❌ 错误 2: 忽略条件路由
某些路由可能根据用户权限或状态条件渲染。

**正确做法**: 检查路由配置中的条件逻辑，记录条件依赖。

### ❌ 错误 3: 不记录入口点
只记录路由，不记录用户如何到达该页面。

**正确做法**: 分析导航组件（Sidebar、Header 等），找出所有指向该页面的链接/按钮。

## 检查清单

完成 Phase 0 后，确认：
- [ ] 所有路由配置文件已被扫描
- [ ] 动态路由参数已被识别
- [ ] 嵌套路由层级已被记录
- [ ] 每个页面的入口点已被标注
- [ ] 页面清单 JSON 格式正确
- [ ] `total_pages` 数量与实际页面数一致
