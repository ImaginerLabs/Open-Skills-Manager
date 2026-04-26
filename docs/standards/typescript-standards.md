# TypeScript 规范

**版本:** 1.0
**最后更新:** 2026-04-26

---

## 类型 vs 接口选择

| 场景 | 选择 | 原因 |
|------|------|------|
| 数据模型定义 | `interface` | 可扩展、可声明合并 |
| Props 定义 | `interface` | 可继承、可扩展 |
| 联合类型 | `type` | 简洁明了 |
| 工具类型 | `type` | 泛型支持更好 |
| 函数类型 | `type` | 更直观 |

```tsx
// ✅ 接口: 数据模型
export interface SkillCardProps {
  skill: Skill;
  onInstall?: (skillId: string) => void;
  showTrustBadge?: boolean;
}

// ✅ 类型: 联合类型
export type Theme = 'light' | 'dark' | 'system';
export type SkillScope = 'global' | 'project';
export type TrustLevel = 'official' | 'verified' | 'community' | 'warning';

// ✅ 类型: 函数签名
export type SkillFilter = (skill: Skill) => boolean;
export type IPCHandler<T, R> = (event: IpcMainInvokeEvent, arg: T) => Promise<R>;
```

---

## 核心数据模型

```typescript
// 技能实体
interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
  path: string;
  scope: 'global' | 'project';
  status: 'enabled' | 'disabled';
  source: 'local' | 'official' | 'lobehub';
  category?: string;
  installedAt: Date;
  updatedAt?: Date;
  translationCache?: string;
  metadata: SkillMetadata;
}

interface SkillMetadata {
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  dependencies?: string[];
}

// 应用配置
interface AppConfig {
  theme: 'light' | 'dark' | 'system';
  language: 'auto' | 'zh-CN' | 'en-US';
  autoUpdate: boolean;
  updateInterval: number;
  translationEnabled: boolean;
  translationModel: string;
  customSources: CustomSource[];
}

// IPC 响应
type IPCResponse<T> = Promise<
  | { success: true; data: T }
  | { success: false; error: IPCError }
>;

interface IPCError {
  code: 'INVALID_INPUT' | 'NOT_FOUND' | 'PERMISSION_DENIED' | 'NETWORK_ERROR' | 'INTERNAL_ERROR';
  message: string;
  details?: unknown;
}
```

---

## 泛型使用

```tsx
// ✅ 泛型函数
export async function fetchWithTimeout<T>(
  url: string,
  timeout: number
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return await response.json() as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ✅ 泛型组件
export function List<T>({
  items,
  renderItem,
  keyExtractor,
}: ListProps<T>): JSX.Element {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item, index)}>
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
}

// ✅ 泛型约束
export function getProperty<T, K extends keyof T>(
  obj: T,
  key: K
): T[K] {
  return obj[key];
}
```

---

## 严格模式配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```
