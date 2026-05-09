# 日志系统接入规范

本文档定义 CSM 日志系统的接入标准，确保日志记录的一致性、可追溯性和可维护性。

## 1. 日志接入验收标准

### 1.1 必须满足的条件

| 条件 | 说明 | 验证方式 |
|------|------|----------|
| 使用统一接口 | 后端使用 `log()` 函数，前端使用 `logService` | 代码审查 |
| 指定正确模块 | 必须使用预定义的 `LOG_MODULES` 常量 | 类型检查 |
| 使用规范错误码 | 必须使用预定义的 `LOG_CODES` 或新申请的错误码 | 代码审查 |
| 包含有价值上下文 | context 必须包含足够的调试信息 | 代码审查 |
| 错误处理完整 | 错误路径必须有日志记录 | 测试覆盖 |

### 1.2 禁止的行为

| 禁止行为 | 原因 | 替代方案 |
|----------|------|----------|
| 使用 `println!` / `eprintln!` | 无法追溯、无法过滤 | 使用 `log()` 函数 |
| 使用 `console.log` / `console.error` | 同上 | 使用 `logService` |
| 硬编码模块名字符串 | 容易拼写错误 | 使用 `LOG_MODULES` 常量 |
| 遗漏 context 信息 | 降低调试效率 | 提供完整的上下文数据 |
| 在生产环境记录 DEBUG 日志 | 性能影响 | DEBUG 级别仅在 debug 构建中写入 |

## 2. 日志级别使用规范

### 2.1 级别定义

| 级别 | 用途 | 示例场景 |
|------|------|----------|
| **ERROR** | 操作失败，影响用户任务完成 | 文件读写失败、网络请求失败、数据解析错误 |
| **WARN** | 潜在问题，不影响当前任务但需关注 | 配置缺失使用默认值、降级处理、兼容性警告 |
| **INFO** | 重要操作成功完成 | 技能导入成功、项目添加成功、同步完成 |
| **DEBUG** | 开发调试信息，仅 debug 构建记录 | 详细流程追踪、变量状态、性能计时 |

### 2.2 级别选择决策树

```
是否影响用户任务完成？
├── 是 → ERROR
└── 否 → 是否需要关注？
            ├── 是 → WARN
            └── 否 → 是否是重要操作成功？
                        ├── 是 → INFO
                        └── 否 → DEBUG
```

### 2.3 使用示例

**ERROR - 操作失败**
```rust
// 后端
log(
    LogLevel::Error,
    "LIBRARY",
    "LIBRARY_DELETE_FAILED",
    &format!("Failed to delete skill: {}", e),
    LogSource::Backend,
    Some(serde_json::json!({
        "skill_id": id,
        "folder_name": folder_name,
        "error": e.to_string(),
    })),
    None,
);
```

```typescript
// 前端
logService.error(
  LOG_MODULES.LIBRARY,
  LOG_CODES.LIBRARY_DELETE_FAILED,
  `Delete failed: ${skill.name}`,
  { skillId: skill.id, error: err.message }
);
```

**WARN - 潜在问题**
```rust
log(
    LogLevel::Warn,
    "SYSTEM",
    "CONFIG_INVALID",
    "Invalid config value, using default",
    LogSource::Backend,
    Some(serde_json::json!({
        "key": key,
        "value": value,
        "default": default_value,
    })),
    None,
);
```

**INFO - 操作成功**
```typescript
logService.info(
  LOG_MODULES.LIBRARY,
  'IMPORT_SUCCESS',
  `Skill imported: ${name}`,
  { path, skillId: skill.id }
);
```

**DEBUG - 调试信息**
```rust
// 仅在 debug 构建中记录
log(
    LogLevel::Debug,
    "DEPLOY",
    "DEPLOY_START",
    &format!("Deploying skill: {}", skill_name),
    LogSource::Backend,
    Some(serde_json::json!({
        "skill_name": skill_name,
        "target": target,
        "timestamp": chrono::Utc::now().to_rfc3339(),
    })),
    None,
);
```

## 3. 模块与错误码规范

### 3.1 模块命名规范

**已定义模块** (定义于 `src/types/log.ts` - `LOG_MODULES`)：

| 模块 | 说明 | 覆盖范围 |
|------|------|----------|
| `LIBRARY` | App Library 管理 | 技能导入、导出、删除、移动 |
| `GLOBAL` | Global Skills 管理 | 全局技能安装、卸载、拉取 |
| `PROJECT` | Project Skills 管理 | 项目添加、移除、刷新 |
| `DEPLOY` | 技能部署 | 部署到 Global/Project |
| `SYNC` | iCloud 同步 | 同步状态、冲突处理 |
| `SYSTEM` | 系统级操作 | 配置、启动、关闭 |
| `UPDATE` | 应用更新 | 检查更新、下载、安装 |

**新增模块规范**：
1. 必须使用 `UPPER_SNAKE_CASE` 格式
2. 必须同时添加到：
   - 后端：`src-tauri/src/utils/logger.rs` 文档注释
   - 前端：`src/types/log.ts` 的 `LOG_MODULES` 常量
3. 模块名应反映功能域，而非具体操作

### 3.2 错误码命名规范

**已定义错误码** (定义于 `src/types/log.ts` - `LOG_CODES`)：

**命名格式**：`{模块}_{操作}_{状态}`

**示例**：
- `LIBRARY_IMPORT_FAILED` - Library 模块导入失败
- `DEPLOY_TO_GLOBAL_FAILED` - 部署到 Global 失败
- `GLOBAL_PULL_SUCCESS` - Global 拉取成功 (自定义码)

**状态后缀**：
| 后缀 | 说明 |
|------|------|
| `_FAILED` | 操作失败 |
| `_SUCCESS` | 操作成功 (用于重要操作追踪) |
| `_NOT_FOUND` | 资源未找到 |
| `_INVALID` | 输入无效 |
| `_TIMEOUT` | 操作超时 |
| `_CONFLICT` | 冲突发生 |

**新增错误码规范**：
1. 必须使用 `UPPER_SNAKE_CASE` 格式
2. 必须与模块名前缀匹配
3. 必须添加到 `LOG_CODES` 常量并附注释说明
4. 描述性要足够具体，避免过于泛化

```typescript
// 正确示例
LIBRARY_IMPORT_FAILED: 'LIBRARY_IMPORT_FAILED',      // 技能导入失败
LIBRARY_EXPORT_FAILED: 'LIBRARY_EXPORT_FAILED',      // 技能导出失败

// 错误示例
LIBRARY_ERROR: 'LIBRARY_ERROR',  // 过于泛化，无法定位问题
```

### 3.3 预定义错误码参考

```typescript
// 通用错误
UNKNOWN_ERROR
INVALID_INPUT
OPERATION_FAILED

// Library 模块
LIBRARY_IMPORT_FAILED
LIBRARY_EXPORT_FAILED
LIBRARY_DELETE_FAILED
LIBRARY_MOVE_FAILED

// Global 模块
GLOBAL_PULL_FAILED
GLOBAL_PUSH_FAILED
GLOBAL_INSTALL_FAILED
GLOBAL_UNINSTALL_FAILED

// Project 模块
PROJECT_ADD_FAILED
PROJECT_REMOVE_FAILED
PROJECT_REFRESH_FAILED
PROJECT_SKILL_NOT_FOUND

// Deploy 模块
DEPLOY_TO_GLOBAL_FAILED
DEPLOY_TO_PROJECT_FAILED
DEPLOY_BATCH_FAILED

// Sync 模块
SYNC_FAILED
SYNC_CONFLICT
SYNC_TIMEOUT

// Update 模块
UPDATE_CHECK_FAILED
UPDATE_DOWNLOAD_FAILED
UPDATE_INSTALL_FAILED

// Storage 模块
STORAGE_READ_FAILED
STORAGE_WRITE_FAILED
STORAGE_DELETE_FAILED
```

## 4. 后端日志记录模式

### 4.1 导入声明

```rust
use crate::utils::logger::{log, LogLevel, LogSource};
```

### 4.2 标准记录模式

**错误处理场景**：
```rust
pub fn some_operation(id: String) -> IpcResult<SomeResult> {
    // 操作失败时记录
    if let Err(e) = perform_operation(&id) {
        log(
            LogLevel::Error,
            "MODULE_NAME",
            "OPERATION_FAILED",
            &format!("Operation failed: {}", e),
            LogSource::Backend,
            Some(serde_json::json!({
                "id": id,
                "error": e.to_string(),
            })),
            None,
        );
        return IpcResult::error("E0001", &format!("Operation failed: {}", e));
    }

    // 操作成功时记录
    log(
        LogLevel::Info,
        "MODULE_NAME",
        "OPERATION_SUCCESS",
        "Operation completed successfully",
        LogSource::Backend,
        Some(serde_json::json!({
            "id": id,
        })),
        None,
    );

    IpcResult::success(result)
}
```

**条件分支场景**：
```rust
match some_result {
    Ok(data) => {
        log(
            LogLevel::Info,
            "MODULE_NAME",
            "OPERATION_SUCCESS",
            &format!("Processed {} items", data.len()),
            LogSource::Backend,
            Some(serde_json::json!({ "count": data.len() })),
            None,
        );
    }
    Err(e) => {
        log(
            LogLevel::Error,
            "MODULE_NAME",
            "OPERATION_FAILED",
            &format!("Failed to process: {}", e),
            LogSource::Backend,
            Some(serde_json::json!({
                "error": e.to_string(),
                "error_kind": format!("{:?}", e.kind()),
            })),
            None,
        );
    }
}
```

### 4.3 Context 信息规范

**必须包含**：
- 相关资源标识符 (id, name, path)
- 错误详细信息 (error message, error kind)
- 足以复现问题的关键参数

**禁止包含**：
- 敏感信息 (密码、token)
- 过大的数据结构 (整个文件内容)
- 循环引用结构

```rust
// 正确示例
Some(serde_json::json!({
    "skill_id": id,
    "source_path": path.to_string_lossy(),
    "error": e.to_string(),
}))

// 错误示例 - 包含敏感信息
Some(serde_json::json!({
    "api_key": api_key,  // 禁止
    "password": password, // 禁止
}))
```

### 4.4 便捷函数使用

对于 SYSTEM 模块的快速日志记录，可使用便捷函数：

```rust
use crate::utils::logger::{log_error, log_warn, log_info, log_debug};

// 自动使用 SYSTEM 模块
log_error("ERROR_CODE", "Error message", serde_json::json!({ "key": "value" }));
log_warn("WARN_CODE", "Warning message", serde_json::json!({ "key": "value" }));
log_info("INFO_CODE", "Info message", serde_json::json!({ "key": "value" }));
log_debug("DEBUG_CODE", "Debug message", serde_json::json!({ "key": "value" }));
```

## 5. 前端日志记录模式

### 5.1 导入声明

```typescript
import { logService, LOG_MODULES, LOG_CODES } from '@/services/logService';
```

### 5.2 标准记录模式

**成功场景**：
```typescript
try {
  await someOperation(skill);
  logService.info(
    LOG_MODULES.LIBRARY,
    'IMPORT_SUCCESS',
    `Skill imported: ${skill.name}`,
    { skillId: skill.id, path: skill.path }
  );
} catch (err) {
  // 错误场景
  logService.error(
    LOG_MODULES.LIBRARY,
    LOG_CODES.LIBRARY_IMPORT_FAILED,
    `Import failed: ${skill.name}`,
    {
      skillId: skill.id,
      error: err instanceof Error ? err.message : String(err),
    }
  );
}
```

**使用便捷方法**：
```typescript
// 各级别快捷方法
logService.debug(module, code, message, context);
logService.info(module, code, message, context);
logService.warn(module, code, message, context);
logService.error(module, code, message, context);

// 报告 Error 对象（自动包含堆栈）
logService.reportError(
  LOG_MODULES.LIBRARY,
  LOG_CODES.LIBRARY_DELETE_FAILED,
  error,
  { skillId: skill.id }
);
```

### 5.3 React Hook 中使用

```typescript
import { useCallback } from 'react';
import { logService, LOG_MODULES, LOG_CODES } from '@/services/logService';

export function useSkillOperation() {
  const handleDelete = useCallback(async (skill: Skill) => {
    try {
      await skillService.delete(skill.id);
      logService.info(
        LOG_MODULES.LIBRARY,
        'DELETE_SUCCESS',
        `Skill deleted: ${skill.name}`,
        { skillId: skill.id }
      );
    } catch (err) {
      logService.error(
        LOG_MODULES.LIBRARY,
        LOG_CODES.LIBRARY_DELETE_FAILED,
        `Delete failed: ${skill.name}`,
        {
          skillId: skill.id,
          error: err instanceof Error ? err.message : String(err),
        }
      );
      throw err;
    }
  }, []);

  return { handleDelete };
}
```

### 5.4 Context 信息规范

**必须包含**：
- 资源标识符 (id, name)
- 用户可见的错误信息
- 操作相关的关键参数

```typescript
// 正确示例
logService.error(
  LOG_MODULES.DEPLOY,
  LOG_CODES.DEPLOY_TO_GLOBAL_FAILED,
  `Deploy failed: ${skill.name}`,
  {
    skillId: skill.id,
    targetPath: globalPath,
    error: err.message,
  }
);

// 错误示例 - 缺少上下文
logService.error(
  LOG_MODULES.DEPLOY,
  LOG_CODES.DEPLOY_TO_GLOBAL_FAILED,
  'Deploy failed',
  {} // 缺少调试信息
);
```

## 6. 禁止事项清单

### 6.1 后端禁止事项

| 禁止 | 替代方案 | 原因 |
|------|----------|------|
| `println!("...")` | `log(LogLevel::Info, ...)` | 无法追溯和过滤 |
| `eprintln!("...")` | `log(LogLevel::Error, ...)` | 同上 |
| `dbg!(variable)` | `log(LogLevel::Debug, ...)` | 仅开发时使用，生产会遗留在代码中 |
| 硬编码模块名 `"Library"` | 使用常量或规范字符串 `"LIBRARY"` | 统一大写，便于过滤 |
| 遗漏 context | 提供完整上下文 | 降低调试效率 |
| 在 INFO/WARN/ERROR 中记录敏感信息 | 过滤或脱敏 | 安全风险 |

### 6.2 前端禁止事项

| 禁止 | 替代方案 | 原因 |
|------|----------|------|
| `console.log(...)` | `logService.info(...)` | 无法统一管理 |
| `console.error(...)` | `logService.error(...)` | 同上 |
| `console.warn(...)` | `logService.warn(...)` | 同上 |
| `console.debug(...)` | `logService.debug(...)` | 同上 |
| 直接使用字符串模块名 | `LOG_MODULES.XXX` | 类型安全 |
| 直接使用字符串错误码 | `LOG_CODES.XXX` | 类型安全 |
| 在生产代码中保留 `console.log` | 移除或替换 | 代码整洁 |

### 6.3 通用禁止事项

| 禁止 | 原因 |
|------|------|
| 在日志中记录密码、API Key、Token | 安全风险 |
| 记录整个文件内容或大数据结构 | 性能影响 |
| 在循环中大量记录 DEBUG 日志 | 性能影响 |
| 使用不明确的错误码如 `UNKNOWN_ERROR` | 无助于问题定位 |
| 日志消息仅有错误信息无操作上下文 | 难以复现问题 |

## 7. 日志查看与调试

### 7.1 日志文件位置

```
~/Library/Logs/CSM/csm.log
```

### 7.2 日志格式

每行一个 JSON 对象：

```json
{
  "timestamp": "2025-05-09T10:30:00.000Z",
  "level": "error",
  "module": "LIBRARY",
  "code": "LIBRARY_DELETE_FAILED",
  "message": "Failed to delete skill: Permission denied",
  "source": "BACKEND",
  "context": {
    "skill_id": "skill-123",
    "folder_name": "my-skill"
  }
}
```

### 7.3 实时查看日志

```bash
# 实时跟踪
tail -f ~/Library/Logs/CSM/csm.log | jq .

# 过滤错误
tail -f ~/Library/Logs/CSM/csm.log | jq 'select(.level == "error")'

# 过滤特定模块
tail -f ~/Library/Logs/CSM/csm.log | jq 'select(.module == "LIBRARY")'
```

### 7.4 应用内查看

设置页面中的日志查看器提供：
- 日志列表与分页
- 按级别/模块/来源过滤
- 关键词搜索
- 导出 (JSON/TXT/CSV)
- 清除功能

## 8. 检查清单

新功能开发时，确保日志接入完整性：

- [ ] 所有错误路径都有 ERROR 日志
- [ ] 所有重要操作成功都有 INFO 日志
- [ ] 使用预定义的 `LOG_MODULES` 和 `LOG_CODES`
- [ ] context 包含足够的调试信息
- [ ] 无 `println!` / `console.log` 残留
- [ ] 无敏感信息记录
- [ ] 新增模块/错误码已更新常量定义
