# 命名约定

**版本:** 1.0
**最后更新:** 2026-04-26

---

## 组件命名

```tsx
// ✅ 正确: PascalCase, 语义化
export function SkillCard({ skill }: SkillCardProps) { ... }
export function SearchOverlay({ isOpen }: SearchOverlayProps) { ... }
export function TrustBadge({ type }: TrustBadgeProps) { ... }

// ❌ 错误: camelCase 或缩写
export function skillCard() { ... }
export function SchModal() { ... }
```

---

## 函数命名

```tsx
// ✅ 正确: camelCase, 动词开头
function fetchSkills(): Promise<Skill[]> { ... }
function handleInstallClick(): void { ... }
function formatSkillName(name: string): string { ... }
function validateSkillPath(path: string): boolean { ... }

// ❌ 错误: PascalCase 或无动词
function FetchSkills() { ... }
function skillName() { ... }
```

### 常用动词前缀

| 前缀 | 用途 | 示例 |
|------|------|------|
| `handle` | 事件处理函数 | `handleClick`, `handleSubmit` |
| `fetch` | 异步数据获取 | `fetchSkills`, `fetchRemoteSource` |
| `format` | 数据格式化 | `formatDate`, `formatSize` |
| `validate` | 数据验证 | `validateSkill`, `validatePath` |
| `compute` | 计算属性 | `computeTotalCount` |
| `render` | 渲染辅助函数 | `renderSkillBadge` |
| `is/has/can` | 布尔判断 | `isSkillEnabled`, `hasUpdate` |

---

## 常量命名

```tsx
// ✅ 正确: UPPER_SNAKE_CASE
export const MAX_SKILLS_PER_PAGE = 50;
export const API_TIMEOUT_MS = 10000;
export const DEFAULT_CATEGORY_COLOR = '#007AFF';

// ✅ 正确: 枚举值
export enum SkillStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
}

// ✅ 正确: 配置对象 (camelCase)
export const defaultSettings: Settings = {
  theme: 'system',
  language: 'auto',
};

// ❌ 错误: camelCase 常量
export const maxSkillsPerPage = 50;
```

---

## 变量命名

```tsx
// ✅ 正确: camelCase, 描述性
const skillList = skills.filter(s => s.status === 'enabled');
const isLoading = true;
const hasError = error !== null;

// ✅ 正确: 布尔变量使用 is/has/can 前缀
const isEnabled = skill.status === 'enabled';
const hasTranslation = skill.translationCache !== undefined;
const canInstall = !isInstalled && hasNetwork;

// ❌ 错误: 无意义缩写
const sklLst = skills.filter(...);
const flg = true;
```

---

## IPC 通道命名

| 格式 | 用途 | 示例 |
|------|------|------|
| `模块:操作` | 请求-响应模式 | `skill:list`, `skill:install` |
| `模块:事件` | 事件通知模式 | `skill:changed`, `theme:changed` |

### 通道命名示例

```
skill:list          # 获取技能列表
skill:install       # 安装技能
skill:enable        # 启用技能
search:remote       # 远程搜索
translate:request   # 翻译请求
config:get          # 获取配置
update:check        # 检查更新
```
