# TypeScript 规范

**版本:** 1.1
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
  skill: LibrarySkill | InstalledSkill;
  onDeploy?: (skillId: string) => void;
  showDeploymentBadge?: boolean;
}

// ✅ 类型: 联合类型
export type Theme = 'light' | 'dark' | 'system';
export type SkillScope = 'library' | 'global' | 'project';
export type TrustLevel = 'official' | 'verified' | 'community';

// ✅ 类型: 函数签名
export type SkillFilter = (skill: LibrarySkill) => boolean;
export type IPCHandler<T, R> = (event: IpcMainInvokeEvent, arg: T) => Promise<R>;
```

---

## 核心数据模型

### 三作用域架构

```typescript
// 统一的作用域类型
type SkillScope = 'library' | 'global' | 'project';
```

### Library Skill (App Library - iCloud 同步)

```typescript
interface LibrarySkill {
  id: string;                    // UUID
  name: string;                  // 技能名称（从 SKILL.md 解析）
  folderName: string;            // 文件夹名称（技能标识符）
  version: string;               // 语义版本
  description: string;           // 简短描述
  path: string;                  // iCloud 容器中的路径
  skillMdPath: string;           // SKILL.md 文件路径
  categoryId?: string;           // 分配的分类
  groupId?: string;              // 分配的分组（嵌套在分类下）
  importedAt: Date;              // 导入时间
  updatedAt?: Date;              // 最后更新时间
  size: number;                  // 总大小（字节）
  fileCount: number;             // 文件数量
  hasResources: boolean;         // 是否有资源文件
  deployments: Deployment[];     // 部署记录
}

interface SkillFile {
  name: string;
  path: string;                  // 相对路径
  size: number;
  type: 'skill-md' | 'template' | 'prompt' | 'config' | 'asset' | 'other';
}

interface Deployment {
  id: string;
  skillId: string;
  targetScope: 'global' | 'project';
  targetPath: string;
  projectName?: string;
  deployedAt: Date;
}
```

### Installed Skill (Global/Project)

```typescript
interface InstalledSkill {
  id: string;                    // UUID（由应用生成）
  name: string;
  folderName: string;
  version: string;
  description: string;
  path: string;                  // 技能文件夹路径
  skillMdPath: string;
  scope: 'global' | 'project';
  projectId?: string;            // 项目引用（如果是项目作用域）
  installedAt?: Date;
  size: number;
  fileCount: number;
  hasResources: boolean;
  sourceLibrarySkillId?: string; // Library 技能引用（如果从 Library 部署）
}
```

### Project Entity

```typescript
interface Project {
  id: string;
  name: string;
  path: string;                  // 项目目录路径
  skillsPath: string;            // .claude/skills/ 路径
  exists: boolean;               // 目录是否存在
  skillCount: number;
  addedAt: Date;
  lastAccessed?: Date;
}
```

### Category & Group

```typescript
interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  groups: Group[];
  skillCount: number;
  isCustom: boolean;
  createdAt: Date;
}

interface Group {
  id: string;
  categoryId: string;
  name: string;
  skillCount: number;
  isCustom: boolean;
  createdAt: Date;
}
```

### 应用配置

```typescript
interface AppConfig {
  theme: 'light' | 'dark' | 'system';
  language: 'auto' | 'en' | 'zh-CN';
  autoUpdateCheck: boolean;
  autoRefreshInterval: number;   // 分钟
  defaultImportCategory?: string;
}
```

### IPC 响应

```typescript
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
export async function invokeIPC<T>(
  channel: string,
  args?: unknown
): Promise<IPCResponse<T>> {
  return window.electron.ipcRenderer.invoke(channel, args);
}

// ✅ 泛型组件
export function SkillList<T extends LibrarySkill | InstalledSkill>({
  skills,
  renderItem,
}: SkillListProps<T>): JSX.Element {
  return (
    <ul>
      {skills.map((skill) => (
        <li key={skill.id}>
          {renderItem(skill)}
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

---

## V1.1 功能（不在 MVP）

以下类型定义保留给 V1.1 版本：

```typescript
// V1.1: 智能分类
interface AIClassificationResult {
  suggestedCategory: string;
  suggestedGroup?: string;
  confidence: number;
}

// V1.1: 翻译缓存
interface TranslationCache {
  originalLanguage: string;
  translatedLanguage: string;
  translatedContent: string;
  cachedAt: Date;
}

// V1.1: LLM 配置
interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'deepseek' | 'ollama' | 'custom';
  model: string;
  apiKey?: string;
  baseUrl?: string;
}
```
