# Grading System

链路复杂度评级和问题严重性分类系统。

## 链路复杂度评级

### L1 - Simple (简单)

**特征**:
- 步骤数: 1-3
- 分支数: 0
- 异步操作: 无
- 问题: 无

**示例**: 主题切换开关

```json
{
  "chain_nodes": [
    { "step": 1, "action": "User toggles switch" },
    { "step": 2, "action": "Theme state updated" }
  ],
  "branches": {},
  "issues_found": []
}
```

### L2 - Moderate (中等)

**特征**:
- 步骤数: 4-7
- 分支数: 1-2
- 异步操作: 有
- 问题: 轻微

**示例**: 文件导入按钮

```json
{
  "chain_nodes": [
    { "step": 1, "action": "Click button" },
    { "step": 2, "action": "File picker opens" },
    { "step": 3, "action": "API call" },
    { "step": 4, "action": "Success feedback" },
    { "step": 5, "action": "Error feedback" }
  ],
  "branches": {
    "success": { "flow": [3, 4] },
    "error": { "flow": [3, 5] }
  },
  "issues_found": [
    { "severity": "low", "description": "Minor UX improvement" }
  ]
}
```

### L3 - Complex (复杂)

**特征**:
- 步骤数: 8-15
- 分支数: 3-5
- 异步操作: 有
- 问题: 显著

**示例**: 技能部署流程

```json
{
  "chain_nodes": [
    // 10+ steps with multiple branches
  ],
  "branches": {
    "success": {},
    "error": {},
    "validation_failed": {},
    "permission_denied": {}
  },
  "issues_found": [
    { "severity": "medium", "description": "Missing confirmation" }
  ]
}
```

### L4 - Critical (关键)

**特征**:
- 步骤数: 16+
- 分支数: 5+
- 异步操作: 有
- 问题: 严重

**示例**: 工厂重置功能

```json
{
  "chain_nodes": [
    // 20+ steps with complex branching
  ],
  "branches": {
    // 6+ different outcomes
  },
  "issues_found": [
    { "severity": "critical", "description": "No confirmation for destructive action" },
    { "severity": "high", "description": "No undo mechanism" }
  ]
}
```

---

## 问题严重性分类

### Critical (关键)

**定义**: 核心功能损坏，可能导致数据丢失

**判断标准**:
- 功能完全无法使用
- 用户数据可能丢失或损坏
- 问题总是发生（非偶发）

**示例问题**:
| 问题 | 影响 | 建议修复 |
|------|------|----------|
| 无确认的删除操作 | 数据永久丢失 | 添加确认对话框 |
| 未处理的 API 错误 | 状态不一致 | 添加错误处理和回滚 |
| 无限循环 | 应用卡死 | 添加终止条件 |

**报告格式**:
```json
{
  "severity": "critical",
  "description": "Factory Reset has no confirmation dialog",
  "impact": "Users can accidentally delete all data with a single click",
  "suggested_fix": "Add confirmation dialog with explicit warning: 'This will permanently delete all your skills and settings. This action cannot be undone.'",
  "code_location": "Settings.tsx:180"
}
```

### High (高)

**定义**: 显著影响用户体验，变通方案困难

**判断标准**:
- 主要功能受影响但可用
- 需要用户额外操作才能完成
- 问题经常发生

**示例问题**:
| 问题 | 影响 | 建议修复 |
|------|------|----------|
| 缺失错误反馈 | 用户不知道操作失败 | 添加 toast.error() |
| 竞态条件 | 重复请求 | 添加防抖或禁用按钮 |
| 无 loading 状态 | 用户可能重复点击 | 添加 isLoading 状态 |

**报告格式**:
```json
{
  "severity": "high",
  "description": "Delete button has no loading state",
  "impact": "Users can trigger multiple delete requests by rapid clicking",
  "suggested_fix": "Add isDeleting state and disable button during operation",
  "code_location": "SkillCard.tsx:95"
}
```

### Medium (中等)

**定义**: 可察觉的问题，存在变通方案

**判断标准**:
- 功能正常但体验不佳
- 用户可以通过其他方式达成目标
- 问题有时发生

**示例问题**:
| 问题 | 影响 | 建议修复 |
|------|------|----------|
| 无成功反馈 | 用户不确定操作是否成功 | 添加 toast.success() |
| 无文件类型验证 | 可能选择错误文件 | 添加文件类型过滤器 |
| 无进度指示 | 大文件导入无反馈 | 添加进度条 |

**报告格式**:
```json
{
  "severity": "medium",
  "description": "Import has no file type validation",
  "impact": "Users may select invalid files and get confusing errors",
  "suggested_fix": "Add file extension filter: { types: [{ accept: { '.skill.md': ['text/markdown'] } }] }",
  "code_location": "Library.tsx:125"
}
```

### Low (低)

**定义**: 轻微改进机会

**判断标准**:
- 功能完全正常
- 仅影响体验细节
- 问题很少发生

**示例问题**:
| 问题 | 影响 | 建议修复 |
|------|------|----------|
| 按钮样式不一致 | 视觉不统一 | 统一使用设计系统组件 |
| 无键盘快捷键 | 操作效率低 | 添加快捷键支持 |
| 无 hover 提示 | 新用户可能困惑 | 添加 tooltip |

**报告格式**:
```json
{
  "severity": "low",
  "description": "Import button has no keyboard shortcut",
  "impact": "Users must click to import, no Cmd+I shortcut",
  "suggested_fix": "Add keyboard event listener for Cmd+I to trigger import",
  "code_location": "Library.tsx:45"
}
```

---

## 评级决策流程

### 步骤 1: 计算步骤数

统计 `chain_nodes` 数组长度。

### 步骤 2: 计算分支数

统计 `branches` 对象中的键数量。

### 步骤 3: 检查异步操作

检查是否有 `api_calls` 或异步 handler（如 `async`, `await`, `Promise`）。

### 步骤 4: 统计问题严重性

```javascript
const issueCount = {
  critical: issues.filter(i => i.severity === 'critical').length,
  high: issues.filter(i => i.severity === 'high').length,
  medium: issues.filter(i => i.severity === 'medium').length,
  low: issues.filter(i => i.severity === 'low').length
};
```

### 步骤 5: 确定等级

```javascript
function determineGrade(nodes, branches, async, issues) {
  const hasCritical = issues.some(i => i.severity === 'critical');
  const hasHigh = issues.some(i => i.severity === 'high');

  if (nodes.length >= 16 || branches.length >= 5 || hasCritical) {
    return 'L4';
  }
  if (nodes.length >= 8 || branches.length >= 3 || hasHigh) {
    return 'L3';
  }
  if (nodes.length >= 4 || branches.length >= 1 || async) {
    return 'L2';
  }
  return 'L1';
}
```

---

## 报告中的评级展示

### 单个链路评级

```markdown
### Import Button - Grade: L2

**Complexity Breakdown**:
- Steps: 5
- Branches: 2 (success, error)
- Async: Yes
- Issues: 1 (medium)
```

### 应用整体评级分布

```markdown
## Chain Complexity Distribution

| Grade | Count | Percentage |
|-------|-------|------------|
| L1 | 8 | 35% |
| L2 | 10 | 43% |
| L3 | 4 | 17% |
| L4 | 1 | 4% |

**Total Elements**: 23
```

### 问题严重性汇总

```markdown
## Issue Summary

| Severity | Count | Action Required |
|----------|-------|-----------------|
| Critical | 2 | Immediate fix |
| High | 5 | Short-term fix |
| Medium | 8 | Plan for fix |
| Low | 3 | Nice-to-have |
```