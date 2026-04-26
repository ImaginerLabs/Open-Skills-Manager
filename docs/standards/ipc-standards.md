# IPC 规范

**版本:** 1.0
**最后更新:** 2026-04-26

---

## 通道命名规范

| 格式 | 用途 | 示例 |
|------|------|------|
| `模块:操作` | 请求-响应模式 | `skill:list`, `skill:install` |
| `模块:事件` | 事件通知模式 | `skill:changed`, `theme:changed` |

---

## 通道列表

### 技能管理

| 通道 | 方向 | 用途 |
|------|------|------|
| `skill:list` | Renderer → Main | 请求技能列表 |
| `skill:get` | Renderer → Main | 获取单个技能 |
| `skill:enable` | Renderer → Main | 切换技能状态 |
| `skill:uninstall` | Renderer → Main | 移除技能 |
| `skill:install` | Renderer → Main | 从远程安装 |
| `skill:validate` | Renderer → Main | 验证技能格式 |
| `skill:installFromFile` | Renderer → Main | 从文件安装 |
| `skill:batch:enable` | Renderer → Main | 批量启用 |
| `skill:batch:disable` | Renderer → Main | 批量禁用 |
| `skill:openInFinder` | Renderer → Main | 在 Finder 中打开 |

### 搜索与发现

| 通道 | 方向 | 用途 |
|------|------|------|
| `search:remote` | Renderer → Main | 搜索远程源 |

### 翻译

| 通道 | 方向 | 用途 |
|------|------|------|
| `translate:request` | Renderer → Main | 请求翻译 |
| `translate:query` | Renderer → Main | 翻译查询 |
| `translate:detect` | Renderer → Main | 检测语言 |
| `translate:refresh` | Renderer → Main | 刷新翻译 |

### 配置

| 通道 | 方向 | 用途 |
|------|------|------|
| `config:get` | Renderer → Main | 获取配置 |
| `config:set` | Renderer → Main | 更新配置 |
| `apiKey:store` | Renderer → Main | 存储 API 密钥 |
| `apiKey:get` | Renderer → Main | 获取掩码密钥 |
| `apiKey:delete` | Renderer → Main | 删除密钥 |
| `apiKey:has` | Renderer → Main | 检查密钥存在 |

### 更新

| 通道 | 方向 | 用途 |
|------|------|------|
| `update:check` | Renderer → Main | 检查更新 |
| `update:apply` | Renderer → Main | 应用更新 |
| `update:applyAll` | Renderer → Main | 应用全部更新 |
| `update:skip` | Renderer → Main | 跳过更新 |

### 事件通知

| 通道 | 方向 | 用途 |
|------|------|------|
| `theme:changed` | Main → Renderer | 系统主题变化 |
| `skill:changed` | Main → Renderer | 文件系统变化 |
| `install:progress` | Main → Renderer | 安装进度 |
| `navigate:settings` | Main → Renderer | 导航到设置 |

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
export const skillIPC = {
  list: (scope?: SkillScope) =>
    ipcService.invoke<Skill[]>('skill:list', { scope }),

  install: (source: string, skillId: string) =>
    ipcService.invoke<Skill>('skill:install', { source, skillId }),

  enable: (id: string, enabled: boolean) =>
    ipcService.invoke<void>('skill:enable', { id, enabled }),
};
```

---

## 错误处理

```tsx
async function installSkill(skillId: string): Promise<void> {
  const result = await skillIPC.install('official', skillId);

  if (!result.success) {
    switch (result.error.code) {
      case 'NETWORK_ERROR':
        toast.error('网络连接失败，请检查网络设置');
        break;
      case 'PERMISSION_DENIED':
        toast.error('没有权限安装到此目录');
        break;
      default:
        toast.error(result.error.message);
    }
    return;
  }

  toast.success(`${result.data.name} 安装成功`);
  useSkillStore.getState().addSkill(result.data);
}
```
