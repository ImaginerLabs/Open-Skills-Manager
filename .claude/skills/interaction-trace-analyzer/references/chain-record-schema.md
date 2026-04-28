# Chain Record Schema

This document defines the JSON schema for interaction chain records.

## Full Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["chain_id", "element_info", "chain_nodes", "endpoints", "logical_intent"],
  "properties": {
    "chain_id": {
      "type": "string",
      "pattern": "^[a-z0-9_-]+_[a-z]+_[0-9]{8}T[0-9]{6}Z$",
      "description": "Unique identifier: element-name_action-type_ISO-timestamp"
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
          "description": "Visible text or aria-label"
        },
        "location": {
          "type": "string",
          "pattern": "^[a-zA-Z0-9_/.-]+:[0-9]+$",
          "description": "File path and line number"
        },
        "trigger": {
          "type": "string",
          "enum": ["click", "input", "change", "submit", "focus", "blur", "select", "toggle", "hover", "drag", "drop"]
        },
        "selector": {
          "type": "string",
          "description": "CSS selector or test ID for automation"
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
          "action": { "type": "string" },
          "handler": { "type": "string" },
          "state_changes": {
            "type": "array",
            "items": { "type": "string" }
          },
          "api_calls": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "service": { "type": "string" },
                "method": { "type": "string" },
                "endpoint": { "type": "string" },
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
                "target_step": { "type": ["integer", "string"] }
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
          "result": { "type": "string" },
          "state": { "type": "object" },
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
      "description": "What this chain is designed to accomplish"
    },
    "issues_found": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["severity", "description"],
        "properties": {
          "severity": {
            "type": "string",
            "enum": ["critical", "high", "medium", "low"]
          },
          "node": { "type": ["integer", "string"] },
          "description": { "type": "string" },
          "impact": { "type": "string" },
          "suggested_fix": { "type": "string" },
          "reproduction_steps": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      }
    },
    "corrections_applied": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "issue_ref": { "type": "string" },
          "fix_description": { "type": "string" },
          "files_modified": {
            "type": "array",
            "items": { "type": "string" }
          },
          "verification": { "type": "string" }
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

## Minimal Required Fields

For a valid chain record, you must include:

```json
{
  "chain_id": "import-button_click_20260429T120000Z",
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
