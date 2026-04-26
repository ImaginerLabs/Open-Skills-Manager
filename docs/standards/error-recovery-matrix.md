# 错误恢复矩阵

本文档定义 Claude Code Skills Manager 的错误分类、恢复策略和 UI 组件映射规则。

## 错误分类

### Recoverable (可恢复)

可自动或用户干预后恢复的错误。

- **网络超时** - 重试或忽略
- **文件锁定** - 等待解锁后重试
- **临时权限拒绝** - 请求权限后重试
- **磁盘临时满** - 清理后重试

### Fatal (致命)

无法恢复，需要用户介入或应用重启。

- **内存溢出** - 应用崩溃
- **数据损坏** - 需要恢复备份
- **永久权限拒绝** - 需要用户修改系统设置
- **关键文件缺失** - 需要重新安装

### Degraded (降级)

非关键功能失败，应用可继续使用。

- **非关键功能失败** - 禁用该功能
- **可选服务不可用** - 使用降级模式

---

## 错误码定义表

| Code | Category | Message | Recoverable | Recovery Options |
|------|----------|---------|-------------|------------------|
| E001 | filesystem | File not found | false | - |
| E002 | filesystem | Permission denied | true | retry, ignore |
| E003 | filesystem | Disk full | true | ignore, abort |
| E004 | filesystem | File locked | true | retry, ignore |
| E101 | network | Network unavailable | true | retry, ignore |
| E102 | network | Request timeout | true | retry, ignore |
| E103 | network | Server error | true | retry, ignore |
| E201 | validation | Invalid SKILL.md | false | - |
| E202 | validation | Missing frontmatter | false | - |
| E203 | validation | Invalid folder name | false | - |
| E301 | ipc | IPC call failed | true | retry |
| E302 | ipc | Command not found | false | - |
| E401 | icloud | iCloud unavailable | true | ignore |
| E402 | icloud | Quota exceeded | true | ignore, abort |
| E403 | icloud | Sync conflict | true | resolve |

### 错误码命名规则

- **E0xx** - 文件系统相关错误
- **E1xx** - 网络相关错误
- **E2xx** - 验证相关错误
- **E3xx** - IPC 通信相关错误
- **E4xx** - iCloud 同步相关错误

---

## 功能关键性矩阵

| Feature | Criticality | Degradation Behavior |
|---------|-------------|---------------------|
| Library | Critical | App unusable |
| Import | Critical | Core flow blocked |
| Deploy | Critical | Core flow blocked |
| Search | Important | Show error, allow manual browse |
| Preview | Important | Show raw markdown |
| Sync | Important | Show offline indicator |
| Theme | Optional | Use system default |
| Localization | Optional | Fall back to English |
| Auto-update | Optional | Skip check, show banner |

### 关键性级别定义

- **Critical** - 核心功能，失败时应用无法正常使用
- **Important** - 重要功能，失败时显示错误但可继续
- **Optional** - 可选功能，失败时静默降级

---

## 恢复流程

```
错误捕获 → 分类 → 查表 → 执行恢复 → 记录日志 → 通知用户
```

### 详细步骤

#### 1. 错误捕获

```typescript
try {
  await operation();
} catch (error) {
  errorHandler.handle(error);
}
```

#### 2. 分类

根据错误类型确定分类：

```typescript
function classifyError(error: unknown): ErrorCategory {
  if (isNetworkError(error)) return 'network';
  if (isFileSystemError(error)) return 'filesystem';
  if (isValidationError(error)) return 'validation';
  if (isIPCError(error)) return 'ipc';
  if (isiCloudError(error)) return 'icloud';
  return 'unknown';
}
```

#### 3. 查表

根据错误码查询恢复策略：

```typescript
const errorEntry = ERROR_MATRIX.find(e => e.code === errorCode);
if (!errorEntry) {
  // 未知错误，按 Fatal 处理
  return { category: 'fatal', options: [] };
}
```

#### 4. 执行恢复

根据恢复选项执行：

```typescript
async function executeRecovery(
  error: AppError,
  option: RecoveryOption
): Promise<void> {
  switch (option) {
    case 'retry':
      await retryOperation(error.context);
      break;
    case 'ignore':
      logger.warn('Error ignored', { error });
      break;
    case 'abort':
      throw new AbortError(error);
      break;
    case 'resolve':
      await showConflictResolution(error);
      break;
  }
}
```

#### 5. 记录日志

```typescript
logger.error('Error occurred', {
  code: error.code,
  category: error.category,
  message: error.message,
  recoverable: error.recoverable,
  context: error.context,
  timestamp: new Date().toISOString(),
});
```

#### 6. 通知用户

根据错误类型选择通知方式：

```typescript
function notifyUser(error: AppError): void {
  if (!error.recoverable) {
    showErrorPage(error);
  } else if (error.category === 'degraded') {
    showToast(error.message);
  } else {
    showErrorDialog(error);
  }
}
```

---

## UI 组件映射

### Recoverable Errors

显示可操作按钮：

```tsx
<ErrorDialog error={error}>
  <Button variant="primary" onClick={handleRetry}>
    Retry
  </Button>
  <Button variant="secondary" onClick={handleIgnore}>
    Ignore
  </Button>
</ErrorDialog>
```

### Fatal Errors

显示错误页面：

```tsx
<ErrorPage error={error}>
  <Typography variant="h2">Something went wrong</Typography>
  <Typography>{error.message}</Typography>
  <Button variant="primary" onClick={handleReport}>
    Report Issue
  </Button>
  <Button variant="secondary" onClick={handleRestart}>
    Restart App
  </Button>
</ErrorPage>
```

### Degraded Errors

显示 Toast 通知：

```tsx
showToast({
  message: error.message,
  type: 'warning',
  duration: 5000,
});
```

---

## 错误处理 Hook

```typescript
function useErrorHandler() {
  const handleError = useCallback((error: unknown) => {
    const appError = normalizeError(error);
    const entry = ERROR_MATRIX.find(e => e.code === appError.code);

    logError(appError);

    if (!entry?.recoverable) {
      showFatalError(appError);
      return;
    }

    if (entry.recoveryOptions.length === 0) {
      showDegradedNotice(appError);
      return;
    }

    showRecoveryDialog(appError, entry.recoveryOptions);
  }, []);

  return { handleError };
}
```

---

## 错误边界集成

```tsx
<ErrorBoundary
  fallback={<ErrorPage />}
  onError={(error, errorInfo) => {
    logger.error('React error boundary caught', {
      error,
      componentStack: errorInfo.componentStack,
    });
  }}
>
  <App />
</ErrorBoundary>
```

---

## 重试策略

### 默认重试配置

```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,  // 1 second
  maxDelay: 10000,  // 10 seconds
  backoffMultiplier: 2,
};
```

### 指数退避实现

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config = RETRY_CONFIG
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < config.maxAttempts - 1) {
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
```

---

## 错误报告

### 报告内容

```typescript
interface ErrorReport {
  code: string;
  message: string;
  category: string;
  stack?: string;
  context: Record<string, unknown>;
  userAgent: string;
  appVersion: string;
  timestamp: string;
}
```

### 报告按钮

```tsx
<Button
  variant="secondary"
  onClick={() => sendErrorReport(error)}
>
  Report Issue
</Button>
```

---

## 相关文档

- [IPC 通信规范](./ipc-standards.md) - IPC 错误处理
- [状态管理](./state-management.md) - 错误状态存储
- [调试规范](./debugging-standards.md) - 错误日志调试
