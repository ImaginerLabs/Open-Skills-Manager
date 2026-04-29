# Phase 1: Element Discovery

元素发现是对每个页面进行扫描，找出所有可交互元素的过程。

## 目标

为当前分析页面建立完整的可交互元素清单，包括元素类型、位置、触发方式和状态依赖。

## 执行流程

```
For each page in Page Inventory:
    │
    ▼
Create Exploration Agent for current page
    │
    ▼
Exploration Agent scans page component
    │
    ▼
Return Interactive Element Inventory
    │
    ▼
Main Agent receives inventory
    │
    ▼
Proceed to Phase 2: Chain Analysis
```

## 输出格式

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

## 元素类型识别

| 类型 | 识别方式 | 触发事件 |
|------|----------|----------|
| **Button** | `<button>`, `onClick`, `role="button"` | click |
| **Input** | `<input>`, `<textarea>`, `onChange`, `onInput` | input, change, blur |
| **Select** | `<select>`, `onChange`, custom dropdown | change |
| **Link** | `<a>`, `<Link>`, `href`, `to` | click |
| **Form** | `<form>`, `onSubmit` | submit |
| **Checkbox** | `<input type="checkbox">`, `checked`, `onChange` | change |
| **Toggle** | Switch component, `checked`, `onCheckedChange` | change |
| **Menu Item** | DropdownMenu item, `onSelect` | click |
| **Dialog Trigger** | Dialog/Modal trigger | click |

## 详细案例

### 案例 1: 扫描 Library 页面

**场景**: 分析一个技能管理应用的 Library 页面

**步骤**:

1. **读取页面组件**
   ```bash
   # 定位页面组件
   src/pages/Library/Library.tsx
   ```

2. **扫描交互元素**
   ```tsx
   // Library.tsx 中的交互元素

   // 1. 导入按钮
   <Button onClick={handleImport}>Import</Button>

   // 2. 搜索输入框
   <Input
     placeholder="Search skills..."
     value={searchQuery}
     onChange={(e) => setSearchQuery(e.target.value)}
   />

   // 3. 分类选择器
   <Select value={category} onValueChange={setCategory}>
     <SelectTrigger>Select Category</SelectTrigger>
     <SelectContent>
       <SelectItem value="all">All</SelectItem>
       <SelectItem value="dev">Development</SelectItem>
     </SelectContent>
   </Select>

   // 4. 技能卡片（点击打开详情）
   <SkillCard skill={skill} onClick={() => openDetail(skill)} />

   // 5. 删除按钮（条件显示）
   <Button
     onClick={() => deleteSkill(skill.id)}
     disabled={!canDelete}
   >
     Delete
   </Button>
   ```

3. **产出元素清单**
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
         "location": "src/pages/Library/Library.tsx:45",
         "trigger": "click",
         "state_dependencies": [],
         "initial_state": "enabled"
       },
       {
         "id": "search-input",
         "type": "input",
         "label": "Search skills...",
         "location": "src/pages/Library/Library.tsx:52",
         "trigger": "input",
         "state_dependencies": [],
         "initial_state": "enabled"
       },
       {
         "id": "category-select",
         "type": "select",
         "label": "Select Category",
         "location": "src/pages/Library/Library.tsx:60",
         "trigger": "change",
         "state_dependencies": [],
         "initial_state": "enabled"
       },
       {
         "id": "skill-card",
         "type": "button",
         "label": "Skill Card (dynamic)",
         "location": "src/pages/Library/Library.tsx:78",
         "trigger": "click",
         "state_dependencies": [],
         "initial_state": "enabled",
         "note": "Rendered for each skill in list"
       },
       {
         "id": "delete-button",
         "type": "button",
         "label": "Delete",
         "location": "src/pages/Library/Library.tsx:95",
         "trigger": "click",
         "state_dependencies": ["disabled when !canDelete"],
         "initial_state": "disabled"
       }
     ],
     "total_count": 5
   }
   ```

### 案例 2: 处理条件渲染元素

**场景**: 某些元素根据状态条件显示/隐藏

**输入代码**:
```tsx
{isLoggedIn && (
  <Button onClick={handleLogout}>Logout</Button>
)}

{isAdmin ? (
  <Button onClick={openAdminPanel}>Admin Panel</Button>
) : null}

<Button disabled={isLoading} onClick={handleSubmit}>
  {isLoading ? "Loading..." : "Submit"}
</Button>
```

**输出**:
```json
{
  "interactive_elements": [
    {
      "id": "logout-button",
      "type": "button",
      "label": "Logout",
      "location": "Header.tsx:25",
      "trigger": "click",
      "state_dependencies": ["visible when isLoggedIn === true"],
      "initial_state": "hidden"
    },
    {
      "id": "admin-panel-button",
      "type": "button",
      "label": "Admin Panel",
      "location": "Header.tsx:28",
      "trigger": "click",
      "state_dependencies": ["visible when isAdmin === true"],
      "initial_state": "hidden"
    },
    {
      "id": "submit-button",
      "type": "button",
      "label": "Submit / Loading...",
      "location": "Form.tsx:42",
      "trigger": "click",
      "state_dependencies": [
        "disabled when isLoading === true",
        "label changes based on isLoading"
      ],
      "initial_state": "enabled"
    }
  ]
}
```

### 案例 3: 处理列表中的动态元素

**场景**: 列表渲染中的可交互元素

**输入代码**:
```tsx
{skills.map((skill) => (
  <div key={skill.id}>
    <h3>{skill.name}</h3>
    <Button onClick={() => editSkill(skill.id)}>Edit</Button>
    <Button onClick={() => deleteSkill(skill.id)}>Delete</Button>
    <Switch
      checked={skill.enabled}
      onCheckedChange={(checked) => toggleSkill(skill.id, checked)}
    />
  </div>
))}
```

**输出**:
```json
{
  "interactive_elements": [
    {
      "id": "edit-button",
      "type": "button",
      "label": "Edit",
      "location": "SkillList.tsx:45",
      "trigger": "click",
      "state_dependencies": [],
      "initial_state": "enabled",
      "dynamic_context": {
        "render_count": "dynamic (one per skill)",
        "click_handler_param": "skill.id"
      }
    },
    {
      "id": "delete-button",
      "type": "button",
      "label": "Delete",
      "location": "SkillList.tsx:46",
      "trigger": "click",
      "state_dependencies": [],
      "initial_state": "enabled",
      "dynamic_context": {
        "render_count": "dynamic (one per skill)",
        "click_handler_param": "skill.id"
      }
    },
    {
      "id": "enable-switch",
      "type": "toggle",
      "label": "Enable/Disable Skill",
      "location": "SkillList.tsx:47",
      "trigger": "change",
      "state_dependencies": [],
      "initial_state": "varies (based on skill.enabled)",
      "dynamic_context": {
        "render_count": "dynamic (one per skill)",
        "checked_value": "skill.enabled"
      }
    }
  ]
}
```

### 案例 4: 处理嵌套组件

**场景**: 可交互元素在子组件中

**输入代码**:
```tsx
// Library.tsx
<SkillList skills={skills} onEdit={handleEdit} />

// SkillList.tsx
<Button onClick={() => onEdit(skill.id)}>Edit</Button>
```

**处理方式**:
1. 识别 props 传递的回调函数
2. 追踪到子组件中的实际触发点
3. 记录完整的调用链

**输出**:
```json
{
  "id": "edit-button",
  "type": "button",
  "label": "Edit",
  "location": "src/components/features/SkillList/SkillList.tsx:25",
  "trigger": "click",
  "handler_chain": [
    "SkillList.tsx:25 - onClick triggers onEdit(skill.id)",
    "Library.tsx:42 - handleEdit function defined"
  ],
  "state_dependencies": [],
  "initial_state": "enabled"
}
```

## 常见错误

### ❌ 错误 1: 遗漏隐藏元素
只扫描可见元素，忽略了条件渲染的元素。

**正确做法**: 分析 JSX 中的条件表达式 `{condition && <Element />}`，记录所有可能的元素。

### ❌ 错误 2: 不追踪子组件
只扫描当前页面组件，忽略了子组件中的交互元素。

**正确做法**: 递归扫描子组件，追踪 props 传递的回调函数。

### ❌ 错误 3: 忽略动态列表
列表中的元素只记录一次，忽略了动态渲染的上下文。

**正确做法**: 在 `dynamic_context` 中记录渲染次数和参数来源。

## 检查清单

完成 Phase 1 后，确认：
- [ ] 页面组件已被完整扫描
- [ ] 所有子组件中的交互元素已被追踪
- [ ] 条件渲染元素的状态依赖已记录
- [ ] 动态列表元素的上下文已标注
- [ ] 元素 ID 唯一且有意义
- [ ] `total_count` 与实际元素数一致
