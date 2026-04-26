# Hook 抽离规范

**版本:** 1.0
**最后更新:** 2026-04-26

---

## 抽离时机

| 场景 | 说明 | 示例 |
|------|------|------|
| 逻辑复用 | 多个组件使用相同逻辑 | `useSkills`, `useSearch` |
| 复杂状态管理 | 状态逻辑超过 30 行或多个相关状态 | `useSkillInstall` |
| 副作用封装 | 复杂的 useEffect 逻辑 | `useKeyboardShortcuts` |
| 数据获取 | API 调用和缓存逻辑 | `useRemoteSkills` |
| 表单处理 | 表单验证和提交逻辑 | `useSettingsForm` |

> **注意**: 行数是参考指标。简单的 50 行 Hook 逻辑清晰则无需拆分；复杂的 30 行 Hook 有多个状态则应考虑抽离。

---

## 命名规范

```tsx
// ✅ 正确: use 前缀，语义化
export function useSkills(scope?: SkillScope): UseSkillsResult { ... }
export function useSkillInstall(skillId: string): UseSkillInstallResult { ... }
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]): void { ... }

// ❌ 错误: 无 use 前缀
export function getSkills() { ... }
export function skillInstall() { ... }
```

---

## 返回类型规范

```tsx
// ✅ 正确: 定义明确的返回类型
interface UseSkillsResult {
  skills: Skill[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useSkills(scope?: SkillScope): UseSkillsResult {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    // ...
  }, [scope]);

  return { skills, isLoading, error, reload };
}

// ❌ 错误: 返回类型不明确
export function useSkills() {
  return [skills, loading, error]; // 元组返回，使用时不清晰
}
```

---

## 文件组织

### 单个 Hook

```tsx
// hooks/useSkillInstall.ts
interface UseSkillInstallResult {
  isInstalling: boolean;
  progress: number;
  error: string | null;
  install: () => Promise<void>;
  cancel: () => void;
}

export function useSkillInstall(skillId: string): UseSkillInstallResult {
  const [isInstalling, setIsInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const install = useCallback(async () => {
    // 安装逻辑
  }, [skillId]);

  const cancel = useCallback(() => {
    // 取消逻辑
  }, []);

  return { isInstalling, progress, error, install, cancel };
}
```

### 多个相关 Hook

```
hooks/
├── useSkills.ts           # 技能列表 Hook
├── useSkillInstall.ts     # 安装 Hook
├── useSkillUpdate.ts      # 更新 Hook
└── skill/                 # 技能相关 Hooks 目录
    ├── index.ts           # 统一导出
    ├── useSkillFilter.ts
    ├── useSkillSort.ts
    └── useSkillSelection.ts
```

---

## 依赖管理

```tsx
// ✅ 正确: 使用 useCallback 和 useMemo 优化
export function useSkillCard(skill: Skill): UseSkillCardResult {
  const handleInstall = useCallback(() => {
    ipcService.invoke('skill:install', { skillId: skill.id });
  }, [skill.id]);

  const handleUninstall = useCallback(() => {
    ipcService.invoke('skill:uninstall', { skillId: skill.id });
  }, [skill.id]);

  return { handleInstall, handleUninstall };
}

// ✅ 正确: 缓存计算结果
export function useFilteredSkills(skills: Skill[], query: string): Skill[] {
  return useMemo(() => {
    if (!query) return skills;
    const lowerQuery = query.toLowerCase();
    return skills.filter(skill =>
      skill.name.toLowerCase().includes(lowerQuery) ||
      skill.description.toLowerCase().includes(lowerQuery)
    );
  }, [skills, query]);
}
```

---

## 完整示例

以下是一个简洁的 Hook 示例（约 50 行），符合规范：

```tsx
// hooks/useSkills.ts
import { useState, useCallback, useEffect } from 'react';
import { ipcService } from '@/services/ipcService';
import type { Skill, SkillScope } from '@/types/skill';

interface UseSkillsResult {
  skills: Skill[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useSkills(scope?: SkillScope): UseSkillsResult {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ipcService.invoke<Skill[]>('skill:list', { scope });
      if (result.success) {
        setSkills(result.data);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { skills, isLoading, error, reload };
}
```

> **注意**: 实际项目中，复杂的 Hook（如 `useSkillInstall` 包含进度追踪、取消逻辑）可能达到 100-150 行，此时应确保逻辑清晰、职责单一。
