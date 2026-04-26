# 命名约定

**版本:** 1.1
**最后更新:** 2026-04-26

---

## 组件命名

```tsx
// ✅ 正确: PascalCase, 语义化
export function SkillCard({ skill }: SkillCardProps) { ... }
export function SearchOverlay({ isOpen }: SearchOverlayProps) { ... }
export function DeploymentBadge({ deployments }: DeploymentBadgeProps) { ... }

// ❌ 错误: camelCase 或缩写
export function skillCard() { ... }
export function SchModal() { ... }
```

---

## 函数命名

```tsx
// ✅ 正确: camelCase, 动词开头
function fetchSkills(): Promise<LibrarySkill[]> { ... }
function handleDeployClick(): void { ... }
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
| `fetch` | 异步数据获取 | `fetchLibrarySkills`, `fetchGlobalSkills` |
| `format` | 数据格式化 | `formatDate`, `formatSize` |
| `validate` | 数据验证 | `validateSkill`, `validatePath` |
| `compute` | 计算属性 | `computeTotalCount` |
| `render` | 渲染辅助函数 | `renderDeploymentBadge` |
| `is/has/can` | 布尔判断 | `isSkillDeployed`, `hasResources` |

---

## 常量命名

```tsx
// ✅ 正确: UPPER_SNAKE_CASE
export const MAX_SKILLS_PER_PAGE = 50;
export const API_TIMEOUT_MS = 10000;
export const DEFAULT_CATEGORY_COLOR = '#007AFF';

// ✅ 正确: 枚举值
export enum SkillScope {
  Library = 'library',
  Global = 'global',
  Project = 'project',
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
const librarySkills = skills.filter(s => s.scope === 'library');
const isLoading = true;
const hasError = error !== null;

// ✅ 正确: 布尔变量使用 is/has/can 前缀
const isDeployed = skill.deployments.length > 0;
const hasResources = skill.hasResources;
const canDeploy = !isDeployed && hasPermission;

// ❌ 错误: 无意义缩写
const libSkl = skills.filter(...);
const flg = true;
```

---

## IPC 通道命名

| 格式 | 用途 | 示例 |
|------|------|------|
| `模块_操作` | 请求-响应模式 | `library_list`, `deploy_to_global` |
| `模块_事件` | 事件通知模式 | `skill_changed`, `theme_changed` |

> **注意**: 使用下划线格式，而非冒号格式。

### 通道命名示例

```
# Library 管理
library_list          # 列出 Library 技能
library_import        # 导入技能
library_export        # 导出技能

# Global 管理
global_list           # 列出全局技能
global_delete         # 删除技能

# Project 管理
project_list          # 列出项目
project_skills        # 列出项目技能
project_refresh       # 刷新项目

# 部署
deploy_to_global      # 部署到全局
deploy_to_project     # 部署到项目

# 配置
config_get            # 获取配置
config_set            # 设置配置

# 更新
update_check          # 检查更新
update_download       # 下载更新
update_install        # 安装更新
```

---

## 文件命名

| 类型 | 格式 | 示例 |
|------|------|------|
| 组件 | PascalCase | `SkillCard.tsx`, `SearchOverlay.tsx` |
| Hook | camelCase + use 前缀 | `useSkills.ts`, `useDeploy.ts` |
| Store | camelCase + Store 后缀 | `libraryStore.ts`, `projectStore.ts` |
| 工具函数 | camelCase | `formatters.ts`, `validators.ts` |
| 类型定义 | camelCase | `skill.ts`, `project.ts` |
| 样式文件 | 组件名 + .module.scss | `SkillCard.module.scss` |

---

## Store 命名

```tsx
// ✅ 正确: 作用域 + Store
useLibraryStore
useGlobalStore
useProjectStore
useSettingsStore
useUpdateStore

// ❌ 错误: 通用名称
useSkillStore    // 不明确是哪个作用域
useDataStore     // 太通用
```
