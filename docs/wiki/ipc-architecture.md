# IPC 服务层架构 Wiki

## 1. IPC 服务架构

### 1.1 IPC 调用封装方式

项目采用 **Tauri invoke API** 进行前后端通信，封装在 `ipcService.ts` 中：

```
Frontend Service → invokeIPC() → Tauri invoke() → Backend Command → IpcResult<T>
```

**核心封装函数** (`src/services/ipcService.ts`):

```typescript
export async function invokeIPC<T>(channel: string, args?: InvokeArgs): Promise<IpcResult<T>> {
  try {
    const result = await invoke<BackendResult<T>>(channel, args);
    // 后端返回 IpcResult<T> 结构
    if (result.success && result.data !== undefined) {
      return { success: true, data: result.data };
    } else if (result.error) {
      return { success: false, error: { code: result.error.code, message: result.error.message } };
    }
    // ...
  } catch (e) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: e.message } };
  }
}
```

**设计特点：**
- 类型安全的泛型封装 `invokeIPC<T>`
- 统一的响应结构 `IpcResult<T>`
- 自动异常捕获和错误转换

### 1.2 响应格式规范

```typescript
// 成功响应
{ success: true, data: T }

// 错误响应
{ success: false, error: { code: string, message: string, details?: unknown } }
```

**错误码类型：**

| 错误码 | 说明 |
|--------|------|
| `INVALID_INPUT` | 输入验证失败 |
| `NOT_FOUND` | 资源不存在 |
| `PERMISSION_DENIED` | 权限不足 |
| `NETWORK_ERROR` | 网络问题 |
| `INTERNAL_ERROR` | 内部错误 |

### 1.3 错误处理机制

**两层错误处理：**

1. **IPC 层 (`ipcService.ts`)**: 捕获 invoke 异常，转换为 `IpcResult` 格式
2. **Service 层**: 业务逻辑处理，使用 `unwrap` 辅助函数

```typescript
// storageService.ts 中的 unwrap 模式
async function unwrap<T>(promise: Promise<IpcResult<T>>): Promise<T> {
  const result = await promise;
  if (result.success) return result.data;
  throw new Error(result.error.message);
}
```

---

## 2. 服务模块列表

| 服务文件 | 功能描述 | 主要方法 |
|---------|---------|---------|
| `ipcService.ts` | IPC 调用核心封装 | `invokeIPC`, `createEventSubscription` |
| `storageService.ts` | **统一存储层** (核心) | Config、IDE、Library、Sync 操作 |
| `libraryService.ts` | App Library 技能管理 | `list`, `get`, `delete`, `import`, `export`, `organize` |
| `globalService.ts` | Global Skills 管理 | `list`, `get`, `delete`, `pull` |
| `projectService.ts` | Project Skills 管理 | `list`, `add`, `remove`, `skills`, `refresh` |
| `deployService.ts` | 技能部署服务 | `toGlobal`, `toProject`, `fromGlobal`, `fromProjectToGlobal` |
| `searchService.ts` | 统一搜索服务 | `search` |
| `configService.ts` | 配置服务 (兼容层) | 基于 `storageService` 的向后兼容封装 |
| `ideService.ts` | IDE 配置管理 | `list`, `getActive`, `setActive`, `getProjects`, `getGlobalSkills` |
| `icloudService.ts` | iCloud 原生操作 | `syncStatus`, `quotaCheck`, `getConflicts`, `resolveConflict` |
| `updateService.ts` | 自动更新服务 | `check`, `download`, `install`, `getStatus` |

**架构演进说明：**
- `storageService.ts` 是新的**统一存储层**，整合了 config/library/sync 操作
- `configService.ts` 和 `syncService.ts` 作为兼容层，内部调用 `storageService`

---

## 3. IPC 通道映射表

### 3.1 Library 模块

| 通道名称 | 用途 | 请求参数 | 响应类型 |
|---------|------|---------|---------|
| `library_list` | 列出所有技能 | - | `LibrarySkill[]` |
| `library_get` | 获取技能详情 | `{ id: string }` | `LibrarySkill` |
| `library_delete` | 删除技能 | `{ id: string }` | `void` |
| `library_import` | 导入技能 | `{ path, groupId?, categoryId? }` | `LibrarySkill` |
| `library_export` | 导出技能 | `{ id, format, destPath }` | `string` |
| `library_export_batch` | 批量导出 | `{ ids, destPath }` | `string` |
| `library_organize` | 组织分类 | `{ skillId, groupId?, categoryId? }` | `void` |
| `library_groups_list` | 列出分组 | - | `Group[]` |
| `library_groups_create` | 创建分组 | `{ name, icon?, notes? }` | `Group` |
| `library_groups_rename` | 重命名分组 | `{ id, newName }` | `Group` |
| `library_groups_delete` | 删除分组 | `{ id }` | `void` |
| `library_categories_create` | 创建分类 | `{ groupId, name, icon?, notes? }` | `Category` |
| `library_categories_rename` | 重命名分类 | `{ groupId, categoryId, newName }` | `Category` |
| `library_categories_delete` | 删除分类 | `{ groupId, categoryId }` | `void` |

### 3.2 Global 模块

| 通道名称 | 用途 | 请求参数 | 响应类型 |
|---------|------|---------|---------|
| `global_list` | 列出全局技能 | - | `GlobalSkill[]` |
| `global_get` | 获取技能详情 | `{ id: string }` | `GlobalSkill` |
| `global_delete` | 删除技能 | `{ id: string }` | `void` |
| `global_pull` | 拉取到 Library | `{ id: string }` | `void` |

### 3.3 Project 模块

| 通道名称 | 用途 | 请求参数 | 响应类型 |
|---------|------|---------|---------|
| `project_list` | 列出监控项目 | - | `Project[]` |
| `project_add` | 添加项目 | `{ path: string }` | `Project` |
| `project_remove` | 移除项目 | `{ id: string }` | `void` |
| `project_skills` | 列出项目技能 | `{ projectId: string }` | `ProjectSkill[]` |
| `project_skill_get` | 获取技能详情 | `{ projectId, skillId }` | `ProjectSkill` |
| `project_skill_delete` | 删除项目技能 | `{ projectId, skillId }` | `void` |
| `project_skill_pull` | 拉取到 Library | `{ projectId, skillId, options? }` | `LibrarySkill` |
| `project_refresh` | 刷新项目 | `{ projectId? }` | `void` |
| `project_refresh_all` | 刷新所有项目 | - | `void` |

### 3.4 Deploy 模块

| 通道名称 | 用途 | 请求参数 | 响应类型 |
|---------|------|---------|---------|
| `deploy_to_global` | 部署到 Global | `{ skillId: string }` | `void` |
| `deploy_to_project` | 部署到项目 | `{ skillId, projectId }` | `void` |
| `deploy_from_global` | 从 Global 部署 | `{ skillId, projectId }` | `void` |
| `deploy_from_project_to_global` | 项目到 Global | `{ skillPath: string }` | `void` |
| `deploy_to_global_for_ide` | 跨 IDE 部署 | `{ skillId, targetIdeId }` | `void` |
| `deploy_to_project_for_ide` | 跨 IDE 项目部署 | `{ skillId, projectId, targetIdeId }` | `void` |

### 3.5 Storage 模块 (统一存储层)

| 通道名称 | 用途 | 请求参数 | 响应类型 |
|---------|------|---------|---------|
| `storage_config_get` | 获取配置 | - | `AppConfig` |
| `storage_config_set_settings` | 更新设置 | `{ settings: Settings }` | `AppConfig` |
| `storage_config_set_sync_enabled` | 设置同步开关 | `{ enabled: boolean }` | `AppConfig` |
| `storage_ide_get_active` | 获取活动 IDE | - | `IDEConfig` |
| `storage_ide_set_active` | 设置活动 IDE | `{ ideId: string }` | `AppConfig` |
| `storage_ide_list` | 列出所有 IDE | - | `IDEConfig[]` |
| `storage_ide_update` | 更新 IDE | `{ ideId, ideConfig }` | `AppConfig` |
| `storage_ide_add` | 添加 IDE | `{ ideConfig: IDEConfig }` | `AppConfig` |
| `storage_ide_remove` | 移除 IDE | `{ ideId: string }` | `AppConfig` |
| `storage_library_get` | 获取 Library 数据 | - | `LibraryData` |
| `storage_groups_get` | 获取分组 | - | `Group[]` |
| `storage_groups_set` | 设置分组 | `{ groups: Group[] }` | `LibraryData` |
| `storage_skills_get` | 获取技能条目 | - | `Record<string, SkillEntry>` |
| `storage_skill_add` | 添加技能条目 | `{ entry: SkillEntry }` | `void` |
| `storage_skill_remove` | 移除技能条目 | `{ folderName: string }` | `void` |
| `storage_sync_state` | 获取同步状态 | - | `SyncState` |
| `storage_sync_force` | 强制同步 | - | `void` |
| `storage_sync_status` | 获取同步信息 | - | `SyncStatusInfo` |
| `storage_needs_migration` | 检查迁移需求 | - | `boolean` |
| `storage_migrate` | 执行迁移 | - | `void` |
| `storage_migrate_rollback` | 回滚迁移 | - | `void` |
| `storage_client_id` | 获取客户端 ID | - | `string` |
| `storage_icloud_available` | iCloud 可用性 | - | `boolean` |
| `storage_ensure_icloud_path` | 确保 iCloud 路径 | - | `string` |
| `storage_invalidate_cache` | 使缓存失效 | - | `void` |
| `storage_reset_to_defaults` | 重置为默认 | - | `void` |

### 3.6 IDE 模块

| 通道名称 | 用途 | 请求参数 | 响应类型 |
|---------|------|---------|---------|
| `ide_global_list` | 获取 IDE 全局技能 | `{ ideId? }` | `GlobalSkill[]` |
| `ide_project_list` | 获取 IDE 项目列表 | `{ ideId? }` | `Project[]` |
| `ide_project_add` | 添加项目到 IDE | `{ ideId?, projectPath }` | `Project` |
| `ide_project_remove` | 移除 IDE 项目 | `{ ideId?, projectId }` | `void` |
| `ide_project_refresh` | 刷新 IDE 项目 | `{ ideId?, projectId }` | `Project` |
| `ide_project_skills` | 获取项目技能 | `{ ideId?, projectId }` | `GlobalSkill[]` |
| `ide_get_global_path` | 获取全局路径 | `{ ideId? }` | `string` |

### 3.7 Search 模块

| 通道名称 | 用途 | 请求参数 | 响应类型 |
|---------|------|---------|---------|
| `search` | 统一搜索 | `{ options: { query, scope?, projectId?, categoryId? } }` | `SearchResult[]` |

### 3.8 iCloud 模块

| 通道名称 | 用途 | 请求参数 | 响应类型 |
|---------|------|---------|---------|
| `icloud_sync_status` | 同步状态 | - | `SyncStatusInfo` |
| `icloud_container_path` | 容器路径 | - | `string` |
| `icloud_quota_check` | 配额检查 | - | `QuotaInfo` |
| `icloud_get_pending_changes` | 待同步变更 | - | `PendingChange[]` |
| `icloud_get_conflicts` | 获取冲突 | - | `ConflictInfo[]` |
| `icloud_resolve_conflict` | 解决冲突 | `{ skillId, resolution }` | `void` |
| `icloud_initialize` | 初始化 iCloud | - | `string` |
| `icloud_local_cache_path` | 本地缓存路径 | - | `string` |

### 3.9 Config 模块 (兼容)

| 通道名称 | 用途 | 请求参数 | 响应类型 |
|---------|------|---------|---------|
| `config_app_data_path` | 应用数据路径 | - | `string` |
| `config_reveal_path` | 在 Finder 中显示 | `{ path: string }` | `void` |
| `config_open_path` | 打开路径 | `{ path: string }` | `void` |

### 3.10 Update 模块

| 通道名称 | 用途 | 请求参数 | 响应类型 |
|---------|------|---------|---------|
| `update_check` | 检查更新 | - | `UpdateResult` |
| `update_download` | 下载更新 | - | `UpdateResult` |
| `update_install` | 安装更新 | - | `UpdateResult` |
| `update_get_status` | 获取状态 | - | `UpdateResult` |

---

## 4. 数据流转模式

### 4.1 调用链路

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  Page/Component                                                   │
│       ↓ 调用                                                      │
│  Store (Zustand) ──→ Service Layer                               │
│                            ↓                                     │
│                      invokeIPC<T>(channel, args)                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Tauri invoke()
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Rust/Tauri)                        │
├─────────────────────────────────────────────────────────────────┤
│  commands/*.rs (IPC Handler)                                     │
│       ↓ 调用                                                      │
│  services/*.rs (业务逻辑)                                         │
│       ↓ 调用                                                      │
│  storage/*.rs (存储层)                                            │
│       ↓ 返回                                                      │
│  IpcResult<T> = { success: true, data: T } | { success: false, error } │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 服务分层架构

```
┌───────────────────────────────────────────────────────────────┐
│                    Service Layer Architecture                   │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐         │
│   │ librarySvc  │   │ globalSvc   │   │ projectSvc  │  ...    │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘         │
│          │                 │                 │                 │
│          └─────────────────┼─────────────────┘                 │
│                            │                                   │
│                            ▼                                   │
│                   ┌─────────────────┐                          │
│                   │   ipcService    │  ← 统一 IPC 封装          │
│                   │  invokeIPC<T>() │                          │
│                   └─────────────────┘                          │
│                            │                                   │
│   ┌────────────────────────┼────────────────────────┐          │
│   │                        │                        │          │
│   ▼                        ▼                        ▼          │
│ ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│ │storageService│    │  ideService │    │updateService│         │
│ │  (统一存储)  │    │  (IDE管理)   │    │  (更新)     │         │
│ └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
```

### 4.3 兼容层模式

项目正在进行架构演进，使用兼容层模式保持向后兼容：

```typescript
// configService.ts 使用兼容层
export const configService = {
  get: configServiceCompat.get,           // 旧接口
  setSettings: storageService.setSettings, // 新接口直接调用
  // ...
};

// storageService.ts 中的兼容层
export const configServiceCompat = {
  get: async () => {
    const [config, library] = await Promise.all([
      storageService.getConfig(),
      storageService.getLibrary(),
    ]);
    // 映射到旧格式
    return { version, settings, groups, ... };
  },
};
```

### 4.4 数据流示例

**技能导入流程：**

```
User Action → libraryStore.import()
    ↓
libraryService.import({ path, groupId, categoryId })
    ↓
invokeIPC<LibrarySkill>('library_import', options)
    ↓
[Tauri Bridge]
    ↓
commands/library.rs::import_skill()
    ↓
services/skill.rs::import_skill()
    ↓
storage/library.rs::save_skill()
    ↓
返回 IpcResult<LibrarySkill>
    ↓
前端更新 store
```

---

## 5. 类型定义汇总

**核心类型文件：** `src/types/skill.ts`

| 类型 | 用途 |
|------|------|
| `LibrarySkill` | Library 中的技能 |
| `GlobalSkill` | 全局安装的技能 |
| `ProjectSkill` | 项目中的技能 |
| `Deployment` | 部署记录 |
| `Group` / `Category` | 分类组织结构 |
| `ImportProgress` / `ExportProgress` | 导入导出进度 |

**IPC 相关类型：**

| 类型 | 定义位置 |
|------|---------|
| `IPCError` | `ipcService.ts` |
| `IpcResult<T>` | `ipcService.ts` |
| `LibraryData` | `storageService.ts` |
| `SyncState` | `storageService.ts` |
| `AppConfig` | `types/ide.ts` |
| `IDEConfig` | `types/ide.ts` |
| `Settings` | `types/ide.ts` |
