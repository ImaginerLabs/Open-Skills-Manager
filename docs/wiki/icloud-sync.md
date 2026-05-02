# iCloud 同步机制 Wiki

## 1. 概述

### 1.1 功能简介

iCloud 同步功能允许用户在多台设备间同步 Library 技能数据，包括：
- 技能文件内容
- 分组/分类结构
- 技能元数据

### 1.2 核心组件

| 组件 | 文件路径 | 职责 |
|------|----------|------|
| `useIcloudSync` | `src/hooks/useIcloudSync.ts` | 同步状态管理、强制同步触发 |
| `useOfflineSync` | `src/hooks/useOfflineSync.ts` | 离线队列、冲突检测与解决 |
| `icloudService` | `src/services/icloudService.ts` | iCloud 原生操作 IPC 封装 |
| `storageService` | `src/services/storageService.ts` | 统一存储层同步操作 |

---

## 2. 同步状态管理

### 2.1 状态类型

```typescript
type SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline' | 'error';
```

| 状态 | 说明 |
|------|------|
| `synced` | 已同步，无待处理变更 |
| `syncing` | 同步中 |
| `pending` | 有待同步的变更 |
| `offline` | iCloud 不可用 |
| `error` | 同步失败 |

### 2.2 状态轮询机制

**轮询间隔**：5 秒 (`POLL_INTERVAL = 5000`)

**轮询内容**：
```typescript
const [state, statusInfo, available, pathResult] = await Promise.all([
  storageService.getSyncState(),      // 获取同步状态
  storageService.getSyncStatus(),     // 获取同步状态信息
  storageService.isICloudAvailable(), // 检查 iCloud 可用性
  icloudService.containerPath(),      // 获取容器路径
]);
```

### 2.3 状态判断逻辑

```
状态判断优先级:
1. iCloud 不可用 → 'offline'
2. 有错误 → 'error'
3. 根据 syncStatusInfo.event.type 判断:
   - 'syncCompleted' → 'synced'
   - 'syncStarted' → 'pending'
   - 'syncFailed' → 'error'
   - 'offlineMode' → 'offline'
   - 'conflictDetected' → 'pending'
4. 检查 pendingChanges 数量 > 0 → 'pending'
5. 有 lastSyncTime → 'synced'
6. 默认 → 'syncing'
```

---

## 3. 同步触发机制

### 3.1 自动同步

**触发条件**：
- 应用启动时自动检查
- 每 5 秒轮询同步状态
- 从离线恢复在线时自动同步待处理变更

**自动同步流程**：
```
useEffect(() => {
  refresh(); // 初始刷新
  
  pollRef.current = setInterval(refresh, POLL_INTERVAL); // 5秒轮询
  
  return () => clearInterval(pollRef.current);
}, [refresh]);
```

### 3.2 手动强制同步

**触发方式**：Settings 页面点击 "Force Sync Now" 按钮

**执行流程**：
```
handleForceSync()
    │
    └─→ forceSync()
            │
            ├─→ setIsLoading(true)
            │
            ├─→ storageService.forceSync()
            │       └─→ IPC: storage_sync_force
            │               └─→ Rust 后端执行 iCloud 同步
            │
            ├─→ Promise.all([
            │       storageService.getSyncState(),
            │       storageService.getSyncStatus(),
            │   ])
            │       └─→ 刷新同步状态
            │
            └─→ setIsLoading(false)
```

---

## 4. 离线队列机制

### 4.1 离线变更队列

**数据结构**：
```typescript
interface OfflineChange {
  id: string;
  skillId: string;
  changeType: 'create' | 'update' | 'delete';
  timestamp: Date;
  data?: unknown;
}
```

### 4.2 队列操作

**添加变更**：
```typescript
queueChange(skillId, changeType, data)
    │
    ├─→ 创建 OfflineChange 对象
    │
    ├─→ 添加到 pendingChanges 状态
    │
    └─→ 如果离线 → saveToLocalStorage(change)
```

**同步待处理变更**：
```typescript
syncPending()
    │
    ├─→ 检查在线状态
    │
    ├─→ 如果离线 → 直接返回
    │
    └─→ 如果在线 → 清空队列并同步
            └─→ clearLocalStorage()
```

### 4.3 本地持久化

**存储键**：`csm_offline_changes`

**持久化时机**：仅在离线时保存变更到 localStorage

**恢复时机**：Hook 初始化时从 localStorage 加载

```
useEffect(() => {
  const stored = loadFromLocalStorage();
  if (stored.length > 0) {
    setPendingChanges(stored);
  }
  // ...
}, []);
```

### 4.4 自动同步触发

```
useEffect(() => {
  if (isOnline && pendingChanges.length > 0) {
    syncPending(); // 恢复在线时自动同步
  }
}, [isOnline, pendingChanges.length]);
```

---

## 5. 冲突检测与解决

### 5.1 冲突数据结构

```typescript
interface ConflictInfo {
  skillId: string;
  skillName: string;
  localVersion: ConflictVersion;
  remoteVersion: ConflictVersion;
}

interface ConflictVersion {
  modifiedTime: string;
  size: number;
  deviceName: string;
}
```

### 5.2 冲突检测机制

**检测时机**：
- 应用启动时
- 每 60 秒定期检查 (`SYNC_INTERVAL = 60000`)

**检测流程**：
```
checkConflicts()
    │
    └─→ icloudService.getConflicts()
            └─→ IPC: icloud_get_conflicts
                    └─→ 返回 ConflictInfo[]
                            └─→ setConflicts(result.data)
```

### 5.3 冲突解决选项

```typescript
type ConflictResolution = 'local' | 'remote' | 'both';
```

| 选项 | 说明 |
|------|------|
| `local` | 保留本地版本，覆盖远程 |
| `remote` | 保留远程版本，覆盖本地 |
| `both` | 保留两个版本（重命名其中一个） |

### 5.4 冲突解决流程

```
用户选择解决方案
    │
    └─→ resolveConflict(skillId, resolution)
            │
            ├─→ icloudService.resolveConflict(skillId, resolution)
            │       └─→ IPC: icloud_resolve_conflict
            │               └─→ Rust 后端执行解决逻辑
            │
            └─→ setConflicts(prev => prev.filter(c => c.skillId !== skillId))
                    └─→ 从冲突列表移除已解决的项
```

### 5.5 UI 交互

**冲突提示横幅**（Library 页面）：
```tsx
{hasConflicts && (
  <button className={styles.conflictBanner} onClick={() => setShowConflictDialog(true)}>
    <Warning size={18} weight="fill" />
    <span>{conflicts.length} skill{conflicts.length !== 1 ? 's' : ''} have sync conflicts</span>
    <span className={styles.conflictAction}>Click to resolve</span>
  </button>
)}
```

**冲突解决对话框**（ConflictDialog）：
- 显示冲突详情（本地/远程版本的修改时间、大小、设备名）
- 提供三个解决选项
- 支持逐个解决冲突

---

## 6. IPC 通道汇总

### 6.1 同步状态相关

| 通道 | 用途 | 响应类型 |
|------|------|----------|
| `storage_sync_state` | 获取同步状态 | `SyncState` |
| `storage_sync_status` | 获取同步状态信息 | `SyncStatusInfo` |
| `storage_sync_force` | 强制同步 | `void` |
| `storage_icloud_available` | 检查 iCloud 可用性 | `boolean` |

### 6.2 iCloud 原生操作

| 通道 | 用途 | 响应类型 |
|------|------|----------|
| `icloud_sync_status` | 获取同步状态 | `SyncStatusInfo` |
| `icloud_container_path` | 获取容器路径 | `string` |
| `icloud_quota_check` | 配额检查 | `QuotaInfo` |
| `icloud_get_pending_changes` | 获取待同步变更 | `PendingChange[]` |
| `icloud_get_conflicts` | 获取冲突列表 | `ConflictInfo[]` |
| `icloud_resolve_conflict` | 解决冲突 | `void` |
| `icloud_initialize` | 初始化 iCloud | `string` |
| `icloud_local_cache_path` | 本地缓存路径 | `string` |

---

## 7. 数据流图

### 7.1 同步状态轮询流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    useIcloudSync Hook                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  useEffect(() => {                                               │
│    refresh(); ──────────────────────────────────────────────┐   │
│    pollRef = setInterval(refresh, 5000); ──────────────────┐│   │
│  }, []);                                                    ││   │
│                                                             ││   │
│  refresh() ─────────────────────────────────────────────────┘│   │
│       │                                                       │   │
│       └─→ Promise.all([                                       │   │
│             storageService.getSyncState(),                    │   │
│             storageService.getSyncStatus(),                   │   │
│             storageService.isICloudAvailable(),               │   │
│             icloudService.containerPath(),                    │   │
│           ])                                                  │   │
│               │                                               │   │
│               └─→ 更新状态: setSyncState, setSyncStatusInfo   │   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 离线队列同步流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    useOfflineSync Hook                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  用户操作 (离线)                                                 │
│       │                                                          │
│       └─→ queueChange(skillId, changeType, data)                │
│               │                                                  │
│               ├─→ 添加到 pendingChanges 状态                     │
│               │                                                  │
│               └─→ saveToLocalStorage() 持久化                   │
│                                                                  │
│  恢复在线 (isOnline = true)                                      │
│       │                                                          │
│       └─→ useEffect 触发 syncPending()                          │
│               │                                                  │
│               └─→ 清空队列 + 同步到 iCloud                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 冲突解决流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    冲突检测与解决                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  定期检查 (60秒间隔)                                             │
│       │                                                          │
│       └─→ checkConflicts()                                      │
│               │                                                  │
│               └─→ icloudService.getConflicts()                  │
│                       │                                          │
│                       └─→ setConflicts(data)                    │
│                                                                  │
│  hasConflicts = true → 显示冲突横幅                              │
│       │                                                          │
│       └─→ 用户点击 → 打开 ConflictDialog                         │
│               │                                                  │
│               └─→ 用户选择解决方案                               │
│                       │                                          │
│                       └─→ resolveConflict(skillId, resolution)  │
│                               │                                  │
│                               ├─→ IPC: icloud_resolve_conflict  │
│                               │                                  │
│                               └─→ 从冲突列表移除                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. 配置与限制

### 8.1 轮询间隔配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `POLL_INTERVAL` | 5000ms | 同步状态轮询间隔 |
| `SYNC_INTERVAL` | 60000ms | 冲突检查间隔 |

### 8.2 存储限制

- iCloud 默认配额：5GB (`storageTotal = 5_000_000_000`)
- 离线队列存储：localStorage (`csm_offline_changes`)

### 8.3 同步范围

**同步的数据**：
- Library 技能文件
- 分组/分类结构
- 技能元数据

**不同步的数据**：
- Global Skills（存储在 `~/.claude/skills/`）
- Project Skills（存储在各项目目录）
- 应用设置（主题、语言等）

---

## 9. 错误处理

### 9.1 离线处理

| 场景 | 处理方式 |
|------|----------|
| iCloud 不可用 | 状态显示 `offline`，变更存入离线队列 |
| 网络中断 | 自动检测，变更存入离线队列 |
| 恢复在线 | 自动同步离线队列 |

### 9.2 冲突处理

| 场景 | 处理方式 |
|------|----------|
| 检测到冲突 | 显示冲突横幅，等待用户解决 |
| 解决失败 | 显示错误 toast，冲突保留在列表 |
| 解决成功 | 从冲突列表移除，刷新技能列表 |

### 9.3 同步失败

| 场景 | 处理方式 |
|------|----------|
| 强制同步失败 | 显示错误 toast，抛出异常 |
| 自动同步失败 | 静默处理，下次轮询重试 |
| 配额超限 | 显示警告，阻止进一步同步 |
