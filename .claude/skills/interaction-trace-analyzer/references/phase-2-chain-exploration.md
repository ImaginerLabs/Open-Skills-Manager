# Phase 2: Chain Exploration

链路探索是分析的核心，追踪每个可交互元素的完整执行链。

## 目标

对每个可交互元素，追踪从触发到终点的完整执行路径，包括：
- 事件处理器
- 状态变化
- API 调用
- 条件分支
- UI 更新
- 错误处理

## ⚠️ 关键约束

**DO NOT CORRECT - DOCUMENT ONLY**
- ✅ 记录所有发现的问题
- ✅ 记录建议的修复方案（文本形式）
- ❌ **绝不**修改任何代码
- ❌ **绝不**应用任何修复

## 执行流程

```
Main Agent receives element inventory
    │
    ├─────────┬─────────┬─────────┬─────────┐
    ▼         ▼         ▼         ▼         ▼
Subagent-1 Subagent-2 Subagent-3 Subagent-4 Subagent-N
(element A) (element B) (element C) (element D) (element N)
    │         │         │         │         │
    └─────────┴─────────┴─────────┴─────────┘
                      │
                      ▼
              Main Agent aggregates results
```

**关键**: 所有 Subagent 在**同一轮**创建，不要顺序创建。

## Subagent 内部流程

```
1. TRIGGER    → 模拟元素触发
2. TRACE      → 追踪执行路径
3. BRANCH     → 处理条件分支
4. RECORD     → 记录链路节点
5. ANALYZE    → 识别问题和意图
6. DOCUMENT   → 文档化问题和建议修复
7. REPORT     → 返回完整链路分析
```

## 详细案例

### 案例 1: 简单按钮点击链路

**场景**: 用户点击 "Import" 按钮

**步骤**:

1. **TRIGGER**: 模拟点击 Import 按钮
   ```tsx
   // Library.tsx:45
   <Button onClick={handleImport}>Import</Button>
   ```

2. **TRACE**: 追踪 handleImport 函数
   ```tsx
   // Library.tsx:120
   const handleImport = async () => {
     setIsImporting(true);  // Step 2: 状态变化

     try {
       const files = await window.showOpenFilePicker();  // Step 3: 文件选择

       if (files.length > 0) {  // Step 4: 条件分支
         const result = await libraryService.importSkills(files);  // Step 5: API 调用
         toast.success(`Imported ${result.count} skills`);  // Step 6: 成功反馈
       }
     } catch (error) {
       toast.error('Import failed');  // Step 7: 错误处理
     } finally {
       setIsImporting(false);  // Step 8: 状态恢复
     }
   };
   ```

3. **BRANCH**: 识别条件分支
   - 分支 A: `files.length > 0` → 执行导入
   - 分支 B: `files.length === 0` → 无操作（用户取消）

4. **RECORD**: 记录链路节点
   ```json
   {
     "chain_nodes": [
       {
         "step": 1,
         "action": "User clicks 'Import' button",
         "handler": "handleImport() in Library.tsx:120",
         "state_changes": [],
         "api_calls": [],
         "branches": []
       },
       {
         "step": 2,
         "action": "Set importing state",
         "handler": "setIsImporting(true)",
         "state_changes": ["isImporting = true"],
         "api_calls": [],
         "branches": []
       },
       {
         "step": 3,
         "action": "Open file picker",
         "handler": "window.showOpenFilePicker()",
         "state_changes": [],
         "api_calls": [],
         "branches": [
           { "condition": "User selects files", "target_step": 4 },
           { "condition": "User cancels", "target_step": "END_CANCEL" }
         ]
       },
       {
         "step": 4,
         "action": "Import skills via API",
         "handler": "libraryService.importSkills(files)",
         "state_changes": [],
         "api_calls": ["library_import"],
         "branches": [
           { "condition": "Success", "target_step": 5 },
           { "condition": "Error", "target_step": 6 }
         ]
       },
       {
         "step": 5,
         "action": "Show success toast",
         "handler": "toast.success()",
         "state_changes": [],
         "api_calls": [],
         "branches": []
       },
       {
         "step": 6,
         "action": "Show error toast",
         "handler": "toast.error()",
         "state_changes": [],
         "api_calls": [],
         "branches": []
       }
     ]
   }
   ```

5. **ANALYZE**: 识别问题
   - 无明显问题
   - 链路完整，有错误处理

6. **DOCUMENT**: 记录结果
   ```json
   {
     "logical_intent": "Allow user to import skill files from local filesystem into the library",
     "issues_found": []
   }
   ```

### 案例 2: 发现缺失错误处理的链路

**场景**: 用户点击 "Delete" 按钮

**追踪过程**:
```tsx
// SkillCard.tsx:45
<Button onClick={() => deleteSkill(skill.id)}>Delete</Button>

// SkillCard.tsx:80
const deleteSkill = async (id: string) => {
  await libraryService.deleteSkill(id);
  // 问题：没有错误处理
  // 问题：没有 loading 状态
  // 问题：没有成功反馈
};
```

**记录问题**:
```json
{
  "logical_intent": "Delete a skill from the library",
  "issues_found": [
    {
      "severity": "high",
      "node": 1,
      "description": "No error handling for delete operation",
      "impact": "If delete fails, user gets no feedback and UI state may be inconsistent",
      "suggested_fix": "Add try-catch block with toast.error() for failed deletes",
      "code_location": "SkillCard.tsx:80"
    },
    {
      "severity": "medium",
      "node": 1,
      "description": "No loading state during delete",
      "impact": "User may click multiple times, causing duplicate delete requests",
      "suggested_fix": "Add isDeleting state and disable button while deleting",
      "code_location": "SkillCard.tsx:45"
    },
    {
      "severity": "low",
      "node": 1,
      "description": "No success feedback after delete",
      "impact": "User may not know if delete succeeded",
      "suggested_fix": "Add toast.success() after successful delete",
      "code_location": "SkillCard.tsx:80"
    }
  ]
}
```

### 案例 3: 复杂状态管理链路

**场景**: 用户切换技能启用状态

**追踪过程**:
```tsx
// SkillList.tsx:47
<Switch
  checked={skill.enabled}
  onCheckedChange={(checked) => toggleSkill(skill.id, checked)}
/>

// SkillList.tsx:100
const toggleSkill = async (id: string, enabled: boolean) => {
  // 1. 乐观更新
  setSkills(prev => prev.map(s =>
    s.id === id ? { ...s, enabled } : s
  ));

  try {
    // 2. API 调用
    await libraryService.updateSkill(id, { enabled });

    // 3. 同步到 iCloud
    if (settings.icloudSync) {
      await icloudService.sync();
    }
  } catch (error) {
    // 4. 回滚乐观更新
    setSkills(prev => prev.map(s =>
      s.id === id ? { ...s, enabled: !enabled } : s
    ));
    toast.error('Failed to update skill');
  }
};
```

**链路记录**:
```json
{
  "chain_nodes": [
    {
      "step": 1,
      "action": "User toggles skill switch",
      "handler": "toggleSkill() in SkillList.tsx:100",
      "state_changes": [],
      "api_calls": [],
      "branches": []
    },
    {
      "step": 2,
      "action": "Optimistic update - update local state immediately",
      "handler": "setSkills()",
      "state_changes": ["skills[id].enabled = new_value"],
      "api_calls": [],
      "branches": []
    },
    {
      "step": 3,
      "action": "API call to persist change",
      "handler": "libraryService.updateSkill()",
      "state_changes": [],
      "api_calls": ["library_update"],
      "branches": [
        { "condition": "Success", "target_step": 4 },
        { "condition": "Error", "target_step": 5 }
      ]
    },
    {
      "step": 4,
      "action": "Sync to iCloud if enabled",
      "handler": "icloudService.sync()",
      "state_changes": [],
      "api_calls": ["icloud_sync"],
      "branches": [
        { "condition": "settings.icloudSync === true", "target_step": 4 },
        { "condition": "settings.icloudSync === false", "target_step": "END_SUCCESS" }
      ]
    },
    {
      "step": 5,
      "action": "Rollback optimistic update on error",
      "handler": "setSkills()",
      "state_changes": ["skills[id].enabled = old_value"],
      "api_calls": [],
      "branches": []
    }
  ],
  "endpoints": [
    {
      "type": "success",
      "result": "Skill enabled/disabled and synced",
      "state": "skills[id].enabled updated, iCloud synced",
      "user_feedback": "none (optimistic update)"
    },
    {
      "type": "error",
      "result": "Update failed, state rolled back",
      "state": "skills[id].enabled reverted to original",
      "user_feedback": "toast.error('Failed to update skill')"
    }
  ],
  "logical_intent": "Toggle skill enabled state with optimistic update and iCloud sync",
  "issues_found": []
}
```

### 案例 4: Tauri IPC 链路追踪

**场景**: 用户点击 "Deploy to Global" 按钮

**追踪过程**:
```tsx
// DeployDialog.tsx:85
<Button onClick={handleDeploy}>Deploy to Global</Button>

// DeployDialog.tsx:120
const handleDeploy = async () => {
  setIsDeploying(true);

  try {
    // 1. 调用 Tauri 后端
    const result = await invoke('deploy_to_global', {
      skillId: skill.id,
      options: deployOptions
    });

    // 2. 处理结果
    if (result.success) {
      toast.success('Deployed successfully');
      onDeployComplete(result.data);
    } else {
      toast.error(result.error);
    }
  } catch (error) {
    toast.error('Deploy failed');
  } finally {
    setIsDeploying(false);
  }
};
```

**追踪到 Rust 后端**:
```rust
// src-tauri/src/commands/deploy.rs:45
#[tauri::command]
pub async fn deploy_to_global(
    skill_id: String,
    options: DeployOptions,
    app: AppHandle
) -> Result<DeployResult, String> {
    // 1. 验证技能存在
    let skill = library_service::get_skill(&skill_id)?;

    // 2. 复制到 Global 目录
    let dest_path = global_service::get_skills_dir();
    fs::copy(&skill.path, &dest_path)?;

    // 3. 更新索引
    global_service::refresh_index()?;

    Ok(DeployResult { success: true, data: ... })
}
```

**链路记录**:
```json
{
  "chain_nodes": [
    {
      "step": 1,
      "action": "User clicks Deploy button",
      "handler": "handleDeploy() in DeployDialog.tsx:120",
      "state_changes": ["isDeploying = true"],
      "api_calls": [],
      "branches": []
    },
    {
      "step": 2,
      "action": "Invoke Tauri IPC command",
      "handler": "invoke('deploy_to_global')",
      "state_changes": [],
      "api_calls": ["deploy_to_global"],
      "branches": []
    },
    {
      "step": 3,
      "action": "[Rust] Validate skill exists",
      "handler": "library_service::get_skill() in deploy.rs:52",
      "state_changes": [],
      "api_calls": [],
      "branches": [
        { "condition": "Skill found", "target_step": 4 },
        { "condition": "Skill not found", "target_step": "END_ERROR" }
      ]
    },
    {
      "step": 4,
      "action": "[Rust] Copy skill to Global directory",
      "handler": "fs::copy() in deploy.rs:55",
      "state_changes": [],
      "api_calls": [],
      "branches": [
        { "condition": "Copy success", "target_step": 5 },
        { "condition": "Copy failed (permissions/disk)", "target_step": "END_ERROR" }
      ]
    },
    {
      "step": 5,
      "action": "[Rust] Refresh Global index",
      "handler": "global_service::refresh_index() in deploy.rs:58",
      "state_changes": [],
      "api_calls": [],
      "branches": []
    },
    {
      "step": 6,
      "action": "Handle success result",
      "handler": "onDeployComplete()",
      "state_changes": [],
      "api_calls": [],
      "branches": []
    }
  ],
  "endpoints": [
    {
      "type": "success",
      "result": "Skill deployed to Global directory",
      "state": "Global index updated",
      "user_feedback": "toast.success('Deployed successfully')"
    },
    {
      "type": "error",
      "result": "Deploy failed",
      "state": "No changes",
      "user_feedback": "toast.error with specific error message"
    }
  ],
  "logical_intent": "Deploy a skill from Library to Global Skills directory",
  "issues_found": []
}
```

## 常见问题模式

### 问题 1: 缺失错误处理
```json
{
  "severity": "high",
  "description": "No error handling for async operation",
  "suggested_fix": "Wrap in try-catch, show error toast, rollback state if needed"
}
```

### 问题 2: 缺失 Loading 状态
```json
{
  "severity": "medium",
  "description": "No loading state during async operation",
  "suggested_fix": "Add isLoading state, disable interactive elements during operation"
}
```

### 问题 3: 竞态条件
```json
{
  "severity": "high",
  "description": "Potential race condition - multiple rapid clicks could trigger duplicate operations",
  "suggested_fix": "Add debounce or disable button immediately on click"
}
```

### 问题 4: 死链路
```json
{
  "severity": "critical",
  "description": "Chain ends without user feedback or state update",
  "suggested_fix": "Ensure all paths have clear endpoint with user feedback"
}
```

## 检查清单

完成 Phase 2 后，确认：
- [ ] 所有元素已分配给 Subagent
- [ ] 每个链路追踪到终点
- [ ] 所有条件分支已记录
- [ ] API 调用已追踪到后端（如适用）
- [ ] 错误处理路径已分析
- [ ] 问题已记录严重性和建议修复
- [ ] **没有应用任何代码修改**
