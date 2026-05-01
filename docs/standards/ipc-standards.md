# IPC 规范

**版本:** 1.1
**最后更新:** 2026-04-26

---

## 通道命名规范

| 格式 | 用途 | 示例 |
|------|------|------|
| `模块_操作` | 请求-响应模式 | `library_list`, `deploy_to_global` |
| `模块_事件` | 事件通知模式 | `skill_changed`, `theme_changed` |

> **注意**: 使用下划线格式（PRD 定义），而非冒号格式。

---

## 通道列表

### App Library 管理

| 通道 | 方向 | 用途 |
|------|------|------|
| `library_list` | Renderer → Main | 列出 App Library 技能 |
| `library_get` | Renderer → Main | 获取技能详情 |
| `library_delete` | Renderer → Main | 删除技能 |
| `library_import` | Renderer → Main | 导入技能（文件夹或 .zip） |
| `library_export` | Renderer → Main | 导出技能 |
| `library_organize` | Renderer → Main | 组织分类/分组 |

### Global Skills 管理

| 通道 | 方向 | 用途 |
|------|------|------|
| `global_list` | Renderer → Main | 列出全局技能 (`~/.claude/skills/`) |
| `global_get` | Renderer → Main | 获取技能详情 |
| `global_delete` | Renderer → Main | 删除技能 |
| `global_pull` | Renderer → Main | 拉取到 Library |

### Project Skills 管理

| 通道 | 方向 | 用途 |
|------|------|------|
| `project_list` | Renderer → Main | 列出监控的项目 |
| `project_add` | Renderer → Main | 添加项目到监控列表 |
| `project_remove` | Renderer → Main | 移除项目监控 |
| `project_skills` | Renderer → Main | 列出项目技能 |
| `project_skill_get` | Renderer → Main | 获取项目技能详情 |
| `project_skill_delete` | Renderer → Main | 删除项目技能 |
| `project_skill_pull` | Renderer → Main | 拉取到 Library |
| `project_refresh` | Renderer → Main | 刷新单个项目技能列表 |
| `project_refresh_all` | Renderer → Main | 刷新所有项目技能列表 |

### 技能部署

| 通道 | 方向 | 用途 |
|------|------|------|
| `deploy_to_global` | Renderer → Main | 部署 Library 技能到 Global |
| `deploy_to_project` | Renderer → Main | 部署技能到项目 |
| `deploy_from_global` | Renderer → Main | 从 Global 部署到项目 |

### 统一搜索

| 通道 | 方向 | 用途 |
|------|------|------|
| `search` | Renderer → Main | 统一搜索（Library/Global/Project） |

### 配置管理

| 通道 | 方向 | 用途 |
|------|------|------|
| `config_get` | Renderer → Main | 获取配置 |
| `config_set` | Renderer → Main | 更新配置 |

### iCloud 同步

| 通道 | 方向 | 用途 |
|------|------|------|
| `icloud_sync_status` | Renderer → Main | 检查同步状态 |
| `icloud_get_conflicts` | Renderer → Main | 获取未解决的冲突列表 |
| `icloud_resolve_conflict` | Renderer → Main | 解决同步冲突 |
| `icloud_container_path` | Renderer → Main | 获取 iCloud 容器路径 |
| `icloud_quota_check` | Renderer → Main | 检查 iCloud 存储配额 |

#### 冲突检测机制

冲突检测基于以下条件：
1. 本地和 iCloud 两边都存在同一技能
2. `SKILL.md` 内容 hash 不同
3. 两边都在上次同步后修改过

#### 冲突解决策略

| 策略 | 行为 |
|------|------|
| `local` | 保留本地版本，推送到 iCloud |
| `remote` | 保留远程版本，拉取到本地 |
| `both` | 保留两者，创建远程版本副本 |

#### ConflictInfo 类型

```typescript
interface ConflictInfo {
  skillId: string;
  skillName: string;
  localVersion: {
    modifiedTime: string;
    size: number;
    deviceName: string;
  };
  remoteVersion: {
    modifiedTime: string;
    size: number;
    deviceName: string;
  };
}
```

#### ConflictRecord 类型（内部）

```typescript
interface ConflictRecord {
  id: string;
  skillId: string;
  skillName: string;
  conflictType: 'ContentConflict' | 'MetadataConflict' | 'BothConflict' | 'DeleteVsModify';
  status: 'Detected' | 'Acknowledged' | 'Resolving' | 'Resolved';
  localHash: string;
  remoteHash: string;
  localMtime: string;
  remoteMtime: string;
  localDevice: string;
  remoteDevice: string;
  detectedAt: string;
  resolvedAt?: string;
  resolution?: 'local' | 'remote' | 'both';
}
```

### 本地化与主题

| 通道 | 方向 | 用途 |
|------|------|------|
| `locale_get` | Renderer → Main | 获取当前语言设置 |
| `locale_set` | Renderer → Main | 设置语言 (en/zh-CN) |
| `locale_detect_system` | Renderer → Main | 检测系统语言 |
| `theme_get` | Renderer → Main | 获取当前主题设置 |
| `theme_set` | Renderer → Main | 设置主题 (light/dark/system) |
| `theme_detect_system` | Renderer → Main | 检测系统外观 |

### 自动更新

| 通道 | 方向 | 用途 |
|------|------|------|
| `update_check` | Renderer → Main | 检查可用更新 |
| `update_download` | Renderer → Main | 下载更新包 |
| `update_install` | Renderer → Main | 安装下载的更新 |
| `update_get_status` | Renderer → Main | 获取当前更新状态/进度 |

### 事件通知

| 通道 | 方向 | 用途 |
|------|------|------|
| `skill_changed` | Main → Renderer | 技能列表变化 |
| `theme_changed` | Main → Renderer | 系统主题变化 |
| `icloud_sync_changed` | Main → Renderer | iCloud 同步状态变化 |
| `update_available` | Main → Renderer | 更新可用通知 |
| `refresh_progress` | Main → Renderer | 刷新进度通知 |

---

## 响应格式

### 成功响应

```typescript
{
  success: true,
  data: T
}
```

### 错误响应

```typescript
{
  success: false,
  error: {
    code: 'INVALID_INPUT' | 'NOT_FOUND' | 'PERMISSION_DENIED' | 'NETWORK_ERROR' | 'INTERNAL_ERROR',
    message: 'Human readable error message',
    details?: unknown
  }
}
```

---

## IPC 服务封装

```tsx
// services/ipcService.ts
export const ipcService = {
  invoke: async <T>(channel: string, args?: unknown): Promise<IPCResponse<T>> => {
    return window.electron.ipcRenderer.invoke(channel, args);
  },

  on: <T>(
    channel: string,
    callback: (event: IpcRendererEvent, data: T) => void
  ): (() => void) => {
    const handler = (_event: IpcRendererEvent, data: T) => callback(_event, data);
    window.electron.ipcRenderer.on(channel, handler);
    return () => window.electron.ipcRenderer.removeListener(channel, handler);
  },
};

// 类型化的 IPC 方法
export const libraryIPC = {
  list: () => ipcService.invoke<LibrarySkill[]>('library_list'),
  get: (id: string) => ipcService.invoke<LibrarySkill>('library_get', { id }),
  delete: (id: string) => ipcService.invoke<void>('library_delete', { id }),
  import: (path: string) => ipcService.invoke<LibrarySkill>('library_import', { path }),
  export: (id: string, format: 'zip' | 'folder') =>
    ipcService.invoke<string>('library_export', { id, format }),
};

export const globalIPC = {
  list: () => ipcService.invoke<InstalledSkill[]>('global_list'),
  get: (id: string) => ipcService.invoke<InstalledSkill>('global_get', { id }),
  delete: (id: string) => ipcService.invoke<void>('global_delete', { id }),
  pull: (id: string) => ipcService.invoke<LibrarySkill>('global_pull', { id }),
};

export const projectIPC = {
  list: () => ipcService.invoke<Project[]>('project_list'),
  add: (path: string) => ipcService.invoke<Project>('project_add', { path }),
  remove: (id: string) => ipcService.invoke<void>('project_remove', { id }),
  skills: (projectId: string) => ipcService.invoke<InstalledSkill[]>('project_skills', { projectId }),
  refresh: (projectId: string) => ipcService.invoke<void>('project_refresh', { projectId }),
  refreshAll: () => ipcService.invoke<void>('project_refresh_all'),
};

export const deployIPC = {
  toGlobal: (skillId: string) => ipcService.invoke<void>('deploy_to_global', { skillId }),
  toProject: (skillId: string, projectId: string) =>
    ipcService.invoke<void>('deploy_to_project', { skillId, projectId }),
  fromGlobal: (skillId: string, projectId: string) =>
    ipcService.invoke<void>('deploy_from_global', { skillId, projectId }),
};

export const searchIPC = {
  search: (query: string, scope?: SkillScope) =>
    ipcService.invoke<SearchResult[]>('search', { query, scope }),
};

export const configIPC = {
  get: () => ipcService.invoke<AppConfig>('config_get'),
  set: (updates: Partial<AppConfig>) => ipcService.invoke<void>('config_set', { updates }),
};

export const updateIPC = {
  check: () => ipcService.invoke<UpdateInfo>('update_check'),
  download: () => ipcService.invoke<void>('update_download'),
  install: () => ipcService.invoke<void>('update_install'),
  getStatus: () => ipcService.invoke<UpdateStatus>('update_get_status'),
};
```

---

## 错误处理

```tsx
async function deploySkill(skillId: string, projectId: string): Promise<void> {
  const result = await deployIPC.toProject(skillId, projectId);

  if (!result.success) {
    switch (result.error.code) {
      case 'NOT_FOUND':
        toast.error('技能不存在');
        break;
      case 'PERMISSION_DENIED':
        toast.error('没有权限部署到此项目');
        break;
      case 'INTERNAL_ERROR':
        toast.error('部署失败，请重试');
        break;
      default:
        toast.error(result.error.message);
    }
    return;
  }

  toast.success('部署成功');
  useLibraryStore.getState().updateSkillDeployments(skillId);
}
```

---

## IPC 调试

IPC 通信问题的调试方法，参考 [调试规范](./debugging-standards.md)：

- **Rust Console**: 查看 `println!` 输出的 IPC 日志
- **CrabNebula DevTools**: 追踪 IPC 命令调用和响应
- **WebView DevTools**: 检查前端 IPC 调用和返回值

---

## V1.1 功能（不在 MVP）

以下 IPC 通道保留给 V1.1 版本：

| 通道 | 用途 | 版本 |
|------|------|------|
| `translate_request` | 翻译请求 | V1.1 |
| `translate_query` | 翻译查询 | V1.1 |
| `translate_detect` | 语言检测 | V1.1 |
| `translate_refresh` | 刷新翻译 | V1.1 |
| `classify_suggest` | AI 分类建议 | V1.1 |
| `llm_configure` | LLM 配置 | V1.1 |
