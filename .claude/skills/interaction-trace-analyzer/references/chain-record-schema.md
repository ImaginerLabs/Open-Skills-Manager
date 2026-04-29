# Chain Record Schema

链路记录是存储每个可交互元素完整分析结果的数据结构。

## ⚠️ 重要说明

**本 skill 不应用任何修复**。`corrections_applied` 字段已移除。
所有问题以 `suggested_fix` 文本形式记录，供用户决策。

## 完整 Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["chain_id", "page_id", "element_info", "chain_nodes", "endpoints", "logical_intent"],
  "properties": {
    "chain_id": {
      "type": "string",
      "pattern": "^[a-z0-9_-]+_[a-z]+_[0-9]{8}T[0-9]{6}Z$",
      "description": "唯一标识符: element-name_action-type_ISO-timestamp"
    },
    "page_id": {
      "type": "string",
      "description": "所属页面ID，对应 Phase 0 发现的页面"
    },
    "element_info": {
      "type": "object",
      "required": ["type", "label", "location", "trigger"],
      "properties": {
        "type": {
          "type": "string",
          "enum": ["button", "input", "select", "link", "form", "checkbox", "radio", "toggle", "menu-item", "tab", "other"]
        },
        "label": {
          "type": "string",
          "description": "显示文本或 aria-label"
        },
        "location": {
          "type": "string",
          "pattern": "^[a-zA-Z0-9_/.-]+:[0-9]+$",
          "description": "文件路径:行号"
        },
        "trigger": {
          "type": "string",
          "enum": ["click", "input", "change", "submit", "focus", "blur", "select", "toggle", "hover", "drag", "drop"]
        },
        "selector": {
          "type": "string",
          "description": "CSS selector 或 test ID（用于自动化测试）"
        }
      }
    },
    "chain_nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["step", "action"],
        "properties": {
          "step": { "type": "integer", "minimum": 1 },
          "action": { "type": "string", "description": "步骤描述" },
          "handler": { "type": "string", "description": "处理函数名和位置" },
          "state_changes": {
            "type": "array",
            "items": { "type": "string" },
            "description": "状态变化列表"
          },
          "api_calls": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "service": { "type": "string" },
                "method": { "type": "string" },
                "endpoint": { "type": "string" },
                "ipc_channel": { "type": "string", "description": "Tauri IPC 通道名" },
                "request_shape": { "type": "object" },
                "response_shape": { "type": "object" }
              }
            }
          },
          "branches": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "condition": { "type": "string" },
                "target_step": { "type": ["integer", "string"], "description": "目标步骤或 END_*" }
              }
            }
          },
          "notes": { "type": "string" }
        }
      }
    },
    "branches": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "condition": { "type": "string" },
          "flow": {
            "type": "array",
            "items": { "type": ["integer", "string"] }
          },
          "endpoint": { "type": "string" }
        }
      }
    },
    "endpoints": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "result"],
        "properties": {
          "type": {
            "type": "string",
            "enum": ["success", "error", "cancel", "redirect", "timeout", "validation_error"]
          },
          "result": { "type": "string", "description": "结果描述" },
          "state": { "type": "object", "description": "最终状态快照" },
          "user_feedback": {
            "type": "object",
            "properties": {
              "type": { "type": "string", "enum": ["toast", "modal", "inline", "redirect", "none"] },
              "message": { "type": "string" }
            }
          },
          "data_persisted": { "type": "boolean" },
          "side_effects": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      }
    },
    "logical_intent": {
      "type": "string",
      "description": "链路的设计意图（自然语言描述）"
    },
    "issues_found": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["severity", "description", "suggested_fix"],
        "properties": {
          "severity": {
            "type": "string",
            "enum": ["critical", "high", "medium", "low"]
          },
          "node": { "type": ["integer", "string"], "description": "问题所在步骤" },
          "description": { "type": "string", "description": "问题描述" },
          "impact": { "type": "string", "description": "影响说明" },
          "suggested_fix": { "type": "string", "description": "建议修复方案（文本形式，不应用）" },
          "code_location": { "type": "string", "description": "需要修改的代码位置" },
          "reproduction_steps": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "analyzed_at": { "type": "string", "format": "date-time" },
        "analyzer_version": { "type": "string" },
        "execution_time_ms": { "type": "integer" }
      }
    }
  }
}
```

## 最小必填字段

```json
{
  "chain_id": "import-button_click_20260429T120000Z",
  "page_id": "library",
  "element_info": {
    "type": "button",
    "label": "Import",
    "location": "ImportButton.tsx:42",
    "trigger": "click"
  },
  "chain_nodes": [
    { "step": 1, "action": "User clicks Import button" }
  ],
  "endpoints": [
    { "type": "success", "result": "File imported successfully" }
  ],
  "logical_intent": "Import files from local filesystem"
}
```

## 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| chain_id | ✅ | 唯一标识符 |
| page_id | ✅ | 所属页面 |
| element_info | ✅ | 元素基本信息 |
| chain_nodes | ✅ | 链路步骤数组 |
| endpoints | ✅ | 所有可能的终点 |
| logical_intent | ✅ | 设计意图描述 |
| branches | ❌ | 条件分支详情 |
| issues_found | ❌ | 发现的问题 |
| metadata | ❌ | 分析元数据 |

## 示例记录

### 简单链路示例 (L1)

```json
{
  "chain_id": "theme-toggle_click_20260429T091500Z",
  "page_id": "settings",
  "element_info": {
    "type": "toggle",
    "label": "Dark Mode",
    "location": "Settings.tsx:85",
    "trigger": "change"
  },
  "chain_nodes": [
    {
      "step": 1,
      "action": "User toggles dark mode switch",
      "handler": "setTheme() in Settings.tsx:120",
      "state_changes": ["theme = 'dark'"],
      "api_calls": [],
      "branches": []
    },
    {
      "step": 2,
      "action": "Apply theme to document",
      "handler": "document.documentElement.setAttribute('data-theme', 'dark')",
      "state_changes": [],
      "api_calls": [],
      "branches": []
    }
  ],
  "endpoints": [
    {
      "type": "success",
      "result": "Theme changed to dark mode",
      "state": { "theme": "dark" },
      "user_feedback": { "type": "none", "message": "immediate visual change" }
    }
  ],
  "logical_intent": "Toggle between light and dark theme",
  "issues_found": []
}
```

### 复杂链路示例 (L3) - Tauri IPC

```json
{
  "chain_id": "deploy-button_click_20260429T092000Z",
  "page_id": "library",
  "element_info": {
    "type": "button",
    "label": "Deploy to Global",
    "location": "DeployDialog.tsx:85",
    "trigger": "click"
  },
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
      "api_calls": [
        {
          "service": "tauri",
          "ipc_channel": "deploy_to_global",
          "request_shape": { "skillId": "string", "options": "object" },
          "response_shape": { "success": "boolean", "data": "object" }
        }
      ],
      "branches": [
        { "condition": "Success", "target_step": 3 },
        { "condition": "Error", "target_step": 4 }
      ]
    },
    {
      "step": 3,
      "action": "Handle success - show toast and close dialog",
      "handler": "onDeployComplete() in DeployDialog.tsx:150",
      "state_changes": ["dialogOpen = false"],
      "api_calls": [],
      "branches": []
    },
    {
      "step": 4,
      "action": "Handle error - show error toast",
      "handler": "toast.error()",
      "state_changes": [],
      "api_calls": [],
      "branches": []
    },
    {
      "step": 5,
      "action": "Reset loading state",
      "handler": "setIsDeploying(false)",
      "state_changes": ["isDeploying = false"],
      "api_calls": [],
      "branches": []
    }
  ],
  "branches": {
    "success": {
      "condition": "deploy_to_global succeeds",
      "flow": [2, 3, 5],
      "endpoint": "Skill deployed, success toast shown, dialog closed"
    },
    "error": {
      "condition": "deploy_to_global fails",
      "flow": [2, 4, 5],
      "endpoint": "Error toast shown, dialog remains open"
    }
  },
  "endpoints": [
    {
      "type": "success",
      "result": "Skill deployed to Global directory",
      "state": { "globalIndex": "updated", "dialogOpen": false },
      "user_feedback": { "type": "toast", "message": "Deployed successfully" }
    },
    {
      "type": "error",
      "result": "Deploy failed",
      "state": { "dialogOpen": true },
      "user_feedback": { "type": "toast", "message": "error message" }
    }
  ],
  "logical_intent": "Deploy a skill from Library to Global Skills directory via Tauri backend",
  "issues_found": [
    {
      "severity": "medium",
      "node": 1,
      "description": "No confirmation before deploy",
      "impact": "User may accidentally deploy to wrong location",
      "suggested_fix": "Add confirmation dialog showing target path before executing deploy",
      "code_location": "DeployDialog.tsx:85"
    }
  ]
}
```

### 有问题的链路示例 (L4)

```json
{
  "chain_id": "factory-reset_click_20260429T093000Z",
  "page_id": "settings",
  "element_info": {
    "type": "button",
    "label": "Factory Reset",
    "location": "Settings.tsx:180",
    "trigger": "click"
  },
  "chain_nodes": [
    {
      "step": 1,
      "action": "User clicks Factory Reset button",
      "handler": "handleFactoryReset() in Settings.tsx:200",
      "state_changes": [],
      "api_calls": [],
      "branches": []
    },
    {
      "step": 2,
      "action": "Invoke reset command",
      "handler": "invoke('factory_reset')",
      "state_changes": [],
      "api_calls": [
        { "service": "tauri", "ipc_channel": "factory_reset" }
      ],
      "branches": []
    }
  ],
  "endpoints": [
    {
      "type": "success",
      "result": "All data reset",
      "state": { "allData": "deleted" },
      "user_feedback": { "type": "none", "message": "" }
    }
  ],
  "logical_intent": "Reset all application data to factory defaults",
  "issues_found": [
    {
      "severity": "critical",
      "node": 1,
      "description": "No confirmation dialog before destructive action",
      "impact": "Users can accidentally delete all data with single click",
      "suggested_fix": "Add confirmation dialog with explicit warning: 'This will permanently delete all your skills and settings. This action cannot be undone.'",
      "code_location": "Settings.tsx:180"
    },
    {
      "severity": "high",
      "node": 2,
      "description": "No undo mechanism",
      "impact": "Data loss is irreversible",
      "suggested_fix": "Consider creating backup before reset, or add undo window (30 seconds)",
      "code_location": "Settings.tsx:200"
    },
    {
      "severity": "medium",
      "node": "general",
      "description": "No success feedback after reset",
      "impact": "User doesn't know reset completed",
      "suggested_fix": "Add toast.success('Reset completed') after successful reset",
      "code_location": "Settings.tsx:200"
    }
  ]
}
```