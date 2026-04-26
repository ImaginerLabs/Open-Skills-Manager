# 安全规范

**版本:** 1.0
**最后更新:** 2026-04-26

---

## 安全架构

| 层 | 实现 | 目的 |
|----|------|------|
| 进程隔离 | Context Isolation 启用 | 防止渲染进程访问 Node.js |
| IPC 验证 | 通道白名单 + Schema 验证 | 防止未授权 IPC 调用 |
| 内容净化 | DOMPurify 处理技能内容 | 防止来自技能文件的 XSS |
| API 密钥存储 | macOS Keychain | 安全的凭据存储 |
| 文件系统访问 | 限定 skills 目录 | 防止任意文件访问 |

---

## 主进程安全配置

```tsx
// electron/main.ts
function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    webPreferences: {
      // ✅ 必须启用的安全配置
      contextIsolation: true,      // 必须: 隔离上下文
      nodeIntegration: false,      // 必须: 禁用 Node.js 集成
      sandbox: true,               // 启用沙箱
      webSecurity: true,           // 启用 Web 安全
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  return win;
}
```

---

## IPC 白名单

```tsx
// electron/preload.ts
const validChannels = new Set([
  'skill:list', 'skill:get', 'skill:enable', 'skill:uninstall',
  'skill:install', 'skill:validate', 'search:remote',
  'translate:request', 'config:get', 'config:set',
  'update:check', 'update:apply', 'theme:changed', 'skill:changed'
]);

const electronAPI = {
  ipcRenderer: {
    invoke: (channel, args) => {
      if (!validChannels.has(channel)) {
        return Promise.reject(new Error(`Invalid IPC channel: ${channel}`));
      }
      return ipcRenderer.invoke(channel, args);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);
```

---

## DOMPurify 内容净化

```tsx
import DOMPurify from 'dompurify';

const purifyConfig: DOMPurify.Config = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
  ALLOWED_ATTR: ['href', 'title'],
  ALLOW_DATA_ATTR: false,
};

export function sanitizeSkillContent(content: string): string {
  return DOMPurify.sanitize(content, purifyConfig);
}

// 使用
export function SkillContentView({ content }: { content: string }): JSX.Element {
  const sanitizedContent = useMemo(() => sanitizeSkillContent(content), [content]);
  return (
    <div
      className="skill-content prose"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
```

---

## macOS Keychain 集成

```tsx
// electron/services/KeychainService.ts
import { safeStorage } from 'electron';

export class KeychainService {
  private static SERVICE_NAME = 'ClaudeCodeSkillsManager';

  static async setApiKey(key: string, value: string): Promise<void> {
    const encrypted = safeStorage.encryptString(value);
    await this.storeEncrypted(key, encrypted);
  }

  static async getApiKey(key: string): Promise<string | null> {
    const encrypted = await this.getEncrypted(key);
    if (!encrypted) return null;
    return safeStorage.decryptString(encrypted);
  }

  static async deleteApiKey(key: string): Promise<void> {
    await this.deleteEncrypted(key);
  }

  static isAvailable(): boolean {
    return safeStorage.isEncryptionAvailable();
  }
}
```

---

## 内容安全策略 (CSP)

```tsx
// 在 HTML 中设置 CSP
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.openai.com;
">
```
