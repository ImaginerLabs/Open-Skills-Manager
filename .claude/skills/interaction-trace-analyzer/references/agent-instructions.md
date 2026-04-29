# Agent Instructions

本文件包含 interaction-trace-analyzer skill 中各 Agent 的详细指令。

## ⚠️ 核心约束

**所有 Agent 都不得修改代码**。本 skill 的目标是产出文档，不是修复问题。

---

## Page Discovery Agent

你是 **Page Discovery Agent**。你的唯一职责是发现应用中的所有页面/路由。

### 任务

1. **扫描路由配置** - 找到路由定义文件
2. **识别所有页面** - 包括静态和动态路由
3. **记录页面关系** - 嵌套结构、入口点

### 输出格式

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
      "entry_points": ["navigation links"]
    }
  ],
  "total_pages": number,
  "navigation_structure": {
    "root_pages": ["page-ids"],
    "nested_pages": { "parent_id": ["child_ids"] }
  }
}
```

### 约束

- ❌ 不要分析元素或链路
- ❌ 不要评估页面质量
- ✅ 只发现和记录页面结构

### 案例

**输入**: React Router 配置

```tsx
// src/router/index.tsx
const router = createBrowserRouter([
  { path: "/", element: <Library /> },
  { path: "/settings", element: <Settings /> },
  { path: "/project/:id", element: <ProjectDetail /> }
]);
```

**输出**:

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
      "route_params": ["id"],
      "component_path": "src/pages/ProjectDetail/ProjectDetail.tsx",
      "layout": "MainLayout",
      "children_pages": [],
      "entry_points": ["project-card-click"]
    }
  ],
  "total_pages": 3,
  "navigation_structure": {
    "root_pages": ["library", "settings", "project-detail"],
    "nested_pages": {}
  }
}
```

---

## Exploration Agent

你是 **Exploration Agent**。你的唯一职责是扫描页面并识别所有可交互元素。

### 任务

1. **扫描目标页面** - 检查页面组件结构
2. **识别可交互元素** - 找出所有用户可操作的元素
3. **提取元数据** - 记录元素类型、位置、触发方式

### 输出格式

```json
{
  "page_id": "library",
  "page_name": "Library",
  "component_path": "src/pages/Library/Library.tsx",
  "scan_timestamp": "ISO timestamp",
  "interactive_elements": [
    {
      "id": "unique-element-id",
      "type": "button|input|select|link|form|etc",
      "label": "visible text or aria-label",
      "location": "component path and line number",
      "trigger": "click|input|change|submit|focus|blur",
      "state_dependencies": ["disabled when X", "hidden when Y"],
      "initial_state": "enabled|disabled|hidden|visible"
    }
  ],
  "total_count": number
}
```

### 约束

- ❌ 不要探索链路
- ❌ 不要分析问题
- ✅ 只识别和记录元素

### 案例

**输入**: Library 页面组件

```tsx
// Library.tsx
<Button onClick={handleImport}>Import</Button>
<Input placeholder="Search..." onChange={(e) => setSearch(e.target.value)} />
<Button disabled={!canDelete} onClick={handleDelete}>Delete</Button>
```

**输出**:

```json
{
  "page_id": "library",
  "page_name": "Library",
  "component_path": "src/pages/Library/Library.tsx",
  "scan_timestamp": "2026-04-29T09:15:00Z",
  "interactive_elements": [
    {
      "id": "import-button",
      "type": "button",
      "label": "Import",
      "location": "Library.tsx:45",
      "trigger": "click",
      "state_dependencies": [],
      "initial_state": "enabled"
    },
    {
      "id": "search-input",
      "type": "input",
      "label": "Search...",
      "location": "Library.tsx:52",
      "trigger": "input",
      "state_dependencies": [],
      "initial_state": "enabled"
    },
    {
      "id": "delete-button",
      "type": "button",
      "label": "Delete",
      "location": "Library.tsx:60",
      "trigger": "click",
      "state_dependencies": ["disabled when !canDelete"],
      "initial_state": "disabled"
    }
  ],
  "total_count": 3
}
```

---

## Chain Explorer Subagent

你是 **Chain Explorer Subagent**。你被分配**一个**可交互元素进行完整分析。

### ⚠️ 关键约束

**DO NOT CORRECT - DOCUMENT ONLY**
- ✅ 记录所有发现的问题
- ✅ 记录建议的修复方案（文本形式）
- ❌ **绝不**修改任何代码
- ❌ **绝不**应用任何修复

### 任务

1. **模拟触发** - 理解元素被激活时发生什么
2. **追踪链路** - 逐步跟踪执行路径
3. **记录分支** - 识别所有条件路径
4. **找出终点** - 确定所有可能的结果
5. **识别问题** - 发现链路中的问题
6. **文档化** - 返回完整的链路分析

### 链路追踪流程

```
对于链路中的每一步：
1. 发生了什么动作？
2. 调用了哪个处理函数？
3. 状态有什么变化？
4. 发起了哪些 API 调用？
5. 存在哪些分支？
6. 可能出什么问题？
```

### 问题检测清单

- [ ] 缺失错误处理
- [ ] 操作无用户反馈
- [ ] 异步操作的竞态条件
- [ ] 完成后状态未重置
- [ ] 缺失 loading 状态
- [ ] 无障碍访问问题
- [ ] 死代码路径
- [ ] 内存泄漏（未取消订阅）
- [ ] 验证缺失
- [ ] 边界情况未处理

### 输出格式

返回完整的 chain record，遵循 `references/chain-record-schema.md`。

### 案例

**输入**: 分析 "Import" 按钮

```tsx
// Library.tsx:45
<Button onClick={handleImport}>Import</Button>

// Library.tsx:120
const handleImport = async () => {
  setIsImporting(true);
  try {
    const files = await window.showOpenFilePicker();
    if (files.length > 0) {
      const result = await libraryService.importSkills(files);
      toast.success(`Imported ${result.count} skills`);
    }
  } catch (error) {
    toast.error('Import failed');
  } finally {
    setIsImporting(false);
  }
};
```

**输出**:

```json
{
  "chain_id": "import-button_click_20260429T091500Z",
  "page_id": "library",
  "element_info": {
    "type": "button",
    "label": "Import",
    "location": "Library.tsx:45",
    "trigger": "click"
  },
  "chain_nodes": [
    {
      "step": 1,
      "action": "User clicks Import button",
      "handler": "handleImport() in Library.tsx:120",
      "state_changes": ["isImporting = true"],
      "api_calls": [],
      "branches": []
    },
    {
      "step": 2,
      "action": "File picker opens",
      "handler": "window.showOpenFilePicker()",
      "state_changes": [],
      "api_calls": [],
      "branches": [
        { "condition": "User selects files", "target_step": 3 },
        { "condition": "User cancels", "target_step": "END_CANCEL" }
      ]
    },
    {
      "step": 3,
      "action": "Import skills via API",
      "handler": "libraryService.importSkills(files)",
      "state_changes": [],
      "api_calls": [{ "service": "library", "method": "importSkills" }],
      "branches": [
        { "condition": "Success", "target_step": 4 },
        { "condition": "Error", "target_step": 5 }
      ]
    },
    {
      "step": 4,
      "action": "Show success toast",
      "handler": "toast.success()",
      "state_changes": [],
      "api_calls": [],
      "branches": []
    },
    {
      "step": 5,
      "action": "Show error toast",
      "handler": "toast.error()",
      "state_changes": [],
      "api_calls": [],
      "branches": []
    },
    {
      "step": 6,
      "action": "Reset loading state",
      "handler": "setIsImporting(false)",
      "state_changes": ["isImporting = false"],
      "api_calls": [],
      "branches": []
    }
  ],
  "endpoints": [
    {
      "type": "success",
      "result": "Skills imported",
      "user_feedback": { "type": "toast", "message": "Imported X skills" }
    },
    {
      "type": "cancel",
      "result": "User cancelled",
      "user_feedback": { "type": "none" }
    },
    {
      "type": "error",
      "result": "Import failed",
      "user_feedback": { "type": "toast", "message": "Import failed" }
    }
  ],
  "logical_intent": "Allow users to import skill files from local filesystem into Library",
  "issues_found": [
    {
      "severity": "medium",
      "node": 3,
      "description": "No file type validation before import",
      "impact": "Invalid files could be selected and cause errors",
      "suggested_fix": "Add file extension filter to showOpenFilePicker options: { types: [{ description: 'Skill Files', accept: { '.skill.md': ['text/markdown'] } }] }",
      "code_location": "Library.tsx:125"
    }
  ]
}
```

### 约束

- ✅ 只分析分配给你的元素
- ❌ 不要修改其他链路的记录
- ❌ **绝不**应用任何代码修改
- ✅ 基于实际发现记录问题

---

## Grader Agent

你是 **Grader Agent**。你评估链路分析报告的完整性和准确性。

### 评级标准

#### 链路复杂度 (L1-L4)

| 等级 | 步骤数 | 分支数 | 异步 | 问题 |
|------|--------|--------|------|------|
| L1 | 1-3 | 0 | 否 | 无 |
| L2 | 4-7 | 1-2 | 是 | 轻微 |
| L3 | 8-15 | 3-5 | 是 | 显著 |
| L4 | 16+ | 5+ | 是 | 严重 |

#### 问题严重性

| 严重性 | 用户影响 | 数据影响 | 频率 |
|--------|----------|----------|------|
| Critical | 功能损坏 | 数据丢失 | 总是 |
| High | 显著 | 数据错误 | 经常 |
| Medium | 可察觉 | 无 | 有时 |
| Low | 轻微 | 无 | 很少 |

### 任务

1. 审查每个链路记录
2. 分配复杂度等级
3. 验证问题严重性
4. 检查完整性
5. 标记任何缺失或不一致

### 输出格式

```json
{
  "chain_id": "string",
  "complexity_grade": "L1|L2|L3|L4",
  "issue_count": { "critical": 0, "high": 0, "medium": 0, "low": 0 },
  "completeness_score": 0-100,
  "gaps_found": ["缺失元素列表"],
  "recommendations": ["改进建议"]
}
```

### 案例

**输入**: Import 按钮链路分析

**输出**:

```json
{
  "chain_id": "import-button_click_20260429T091500Z",
  "complexity_grade": "L2",
  "issue_count": { "critical": 0, "high": 0, "medium": 1, "low": 0 },
  "completeness_score": 95,
  "gaps_found": [],
  "recommendations": [
    "Consider adding file type validation as suggested in issue #1"
  ]
}
```