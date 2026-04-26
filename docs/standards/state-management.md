# 状态管理规范

**版本:** 1.0
**最后更新:** 2026-04-26

---

## Store 结构

项目使用 Zustand 进行状态管理，分为以下 Store：

| Store | 用途 | 文件 |
|-------|------|------|
| `skillStore` | 技能数据 | `stores/skillStore.ts` |
| `settingsStore` | 应用设置 | `stores/settingsStore.ts` |
| `uiStore` | UI 状态 | `stores/uiStore.ts` |
| `updateStore` | 更新状态 | `stores/updateStore.ts` |

---

## Store 实现模式

```tsx
// stores/skillStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface SkillState {
  // 状态
  skills: Skill[];
  selectedSkill: Skill | null;
  isLoading: boolean;
  error: string | null;

  // 操作
  setSkills: (skills: Skill[]) => void;
  addSkill: (skill: Skill) => void;
  removeSkill: (id: string) => void;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  selectSkill: (skill: Skill | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSkillStore = create<SkillState>()(
  devtools(
    persist(
      (set) => ({
        // 初始状态
        skills: [],
        selectedSkill: null,
        isLoading: false,
        error: null,

        // 操作实现
        setSkills: (skills) => set({ skills }),

        addSkill: (skill) =>
          set((state) => ({
            skills: [...state.skills, skill],
          })),

        removeSkill: (id) =>
          set((state) => ({
            skills: state.skills.filter((skill) => skill.id !== id),
          })),

        updateSkill: (id, updates) =>
          set((state) => ({
            skills: state.skills.map((skill) =>
              skill.id === id ? { ...skill, ...updates } : skill
            ),
          })),

        selectSkill: (skill) => set({ selectedSkill: skill }),

        setLoading: (isLoading) => set({ isLoading }),

        setError: (error) => set({ error }),
      }),
      {
        name: 'skill-storage',
        partialize: (state) => ({
          skills: state.skills,
        }),
      }
    ),
    { name: 'SkillStore' }
  )
);
```

---

## 使用模式

### 选择器模式

```tsx
// ✅ 正确: 选择器模式，避免不必要的重渲染
function SkillList(): JSX.Element {
  const skills = useSkillStore((state) => state.skills);
  const isLoading = useSkillStore((state) => state.isLoading);
  const setSkills = useSkillStore((state) => state.setSkills);
  // ...
}

// ✅ 正确: 批量选择
function SkillStats(): JSX.Element {
  const { skills, selectedSkill } = useSkillStore((state) => ({
    skills: state.skills,
    selectedSkill: state.selectedSkill,
  }));
  // ...
}

// ❌ 错误: 选择整个 store
function SkillCard(): JSX.Element {
  const store = useSkillStore(); // 任何状态变化都会触发重渲染
}
```

### 在组件外使用

```tsx
// 在非组件代码中使用
const skills = useSkillStore.getState().skills;
useSkillStore.getState().addSkill(newSkill);

// 订阅状态变化
const unsubscribe = useSkillStore.subscribe((state) => {
  console.log('Skills updated:', state.skills);
});
```

---

## 持久化配置

```tsx
// 仅持久化必要的状态
persist(
  (set) => ({ /* ... */ }),
  {
    name: 'skill-storage',
    partialize: (state) => ({
      skills: state.skills,
      // 不持久化 isLoading, error 等临时状态
    }),
  }
)
```
