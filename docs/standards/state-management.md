# 状态管理规范

**版本:** 1.1
**最后更新:** 2026-04-26

---

## Store 结构

项目使用 Zustand 进行状态管理，按三作用域架构划分 Store：

| Store | 用途 | 文件 |
|-------|------|------|
| `libraryStore` | App Library 技能数据 | `stores/libraryStore.ts` |
| `globalStore` | Global Skills 数据 | `stores/globalStore.ts` |
| `projectStore` | Project Skills 数据 | `stores/projectStore.ts` |
| `settingsStore` | 应用设置 | `stores/settingsStore.ts` |
| `updateStore` | 更新状态 | `stores/updateStore.ts` |
| `uiStore` | UI 状态 | `stores/uiStore.ts` |

---

## Store 实现模式

### Library Store (App Library)

```tsx
// stores/libraryStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { LibrarySkill, Category, Group, Deployment } from '@/types/skill';

interface LibraryState {
  // 状态
  skills: LibrarySkill[];
  categories: Category[];
  groups: Group[];
  selectedSkill: LibrarySkill | null;
  isLoading: boolean;
  error: string | null;

  // 操作
  setSkills: (skills: LibrarySkill[]) => void;
  addSkill: (skill: LibrarySkill) => void;
  removeSkill: (id: string) => void;
  updateSkill: (id: string, updates: Partial<LibrarySkill>) => void;
  selectSkill: (skill: LibrarySkill | null) => void;
  updateDeployments: (skillId: string, deployments: Deployment[]) => void;
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  removeCategory: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLibraryStore = create<LibraryState>()(
  devtools(
    persist(
      (set) => ({
        // 初始状态
        skills: [],
        categories: [],
        groups: [],
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
            selectedSkill: state.selectedSkill?.id === id ? null : state.selectedSkill,
          })),

        updateSkill: (id, updates) =>
          set((state) => ({
            skills: state.skills.map((skill) =>
              skill.id === id ? { ...skill, ...updates } : skill
            ),
          })),

        selectSkill: (skill) => set({ selectedSkill: skill }),

        updateDeployments: (skillId, deployments) =>
          set((state) => ({
            skills: state.skills.map((skill) =>
              skill.id === skillId ? { ...skill, deployments } : skill
            ),
          })),

        setCategories: (categories) => set({ categories }),

        addCategory: (category) =>
          set((state) => ({
            categories: [...state.categories, category],
          })),

        removeCategory: (id) =>
          set((state) => ({
            categories: state.categories.filter((cat) => cat.id !== id),
          })),

        setLoading: (isLoading) => set({ isLoading }),

        setError: (error) => set({ error }),
      }),
      {
        name: 'library-storage',
        partialize: (state) => ({
          categories: state.categories,
          groups: state.groups,
        }),
      }
    ),
    { name: 'LibraryStore' }
  )
);
```

### Global Store

```tsx
// stores/globalStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { InstalledSkill } from '@/types/skill';

interface GlobalState {
  skills: InstalledSkill[];
  selectedSkill: InstalledSkill | null;
  isLoading: boolean;
  error: string | null;

  setSkills: (skills: InstalledSkill[]) => void;
  addSkill: (skill: InstalledSkill) => void;
  removeSkill: (id: string) => void;
  selectSkill: (skill: InstalledSkill | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useGlobalStore = create<GlobalState>()(
  devtools(
    (set) => ({
      skills: [],
      selectedSkill: null,
      isLoading: false,
      error: null,

      setSkills: (skills) => set({ skills }),
      addSkill: (skill) => set((state) => ({ skills: [...state.skills, skill] })),
      removeSkill: (id) =>
        set((state) => ({
          skills: state.skills.filter((skill) => skill.id !== id),
        })),
      selectSkill: (skill) => set({ selectedSkill: skill }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    { name: 'GlobalStore' }
  )
);
```

### Project Store

```tsx
// stores/projectStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Project, InstalledSkill } from '@/types/skill';

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  projectSkills: Map<string, InstalledSkill[]>;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  selectProject: (project: Project | null) => void;
  setProjectSkills: (projectId: string, skills: InstalledSkill[]) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    persist(
      (set) => ({
        projects: [],
        selectedProject: null,
        projectSkills: new Map(),
        isLoading: false,
        isRefreshing: false,
        error: null,

        setProjects: (projects) => set({ projects }),
        addProject: (project) =>
          set((state) => ({ projects: [...state.projects, project] })),
        removeProject: (id) =>
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            selectedProject: state.selectedProject?.id === id ? null : state.selectedProject,
          })),
        updateProject: (id, updates) =>
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === id ? { ...p, ...updates } : p
            ),
          })),
        selectProject: (project) => set({ selectedProject: project }),
        setProjectSkills: (projectId, skills) =>
          set((state) => {
            const newMap = new Map(state.projectSkills);
            newMap.set(projectId, skills);
            return { projectSkills: newMap };
          }),
        setLoading: (isLoading) => set({ isLoading }),
        setRefreshing: (isRefreshing) => set({ isRefreshing }),
        setError: (error) => set({ error }),
      }),
      {
        name: 'project-storage',
        partialize: (state) => ({
          projects: state.projects,
        }),
      }
    ),
    { name: 'ProjectStore' }
  )
);
```

### Settings Store

```tsx
// stores/settingsStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: 'auto' | 'en' | 'zh-CN';
  autoUpdateCheck: boolean;
  autoRefreshInterval: number;
  defaultImportCategory?: string;

  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: 'auto' | 'en' | 'zh-CN') => void;
  setAutoUpdateCheck: (enabled: boolean) => void;
  setAutoRefreshInterval: (minutes: number) => void;
  setDefaultImportCategory: (categoryId: string | undefined) => void;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'system',
        language: 'auto',
        autoUpdateCheck: true,
        autoRefreshInterval: 5,
        defaultImportCategory: undefined,

        setTheme: (theme) => set({ theme }),
        setLanguage: (language) => set({ language }),
        setAutoUpdateCheck: (autoUpdateCheck) => set({ autoUpdateCheck }),
        setAutoRefreshInterval: (autoRefreshInterval) => set({ autoRefreshInterval }),
        setDefaultImportCategory: (defaultImportCategory) => set({ defaultImportCategory }),
      }),
      { name: 'settings-storage' }
    ),
    { name: 'SettingsStore' }
  )
);
```

### Update Store

```tsx
// stores/updateStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UpdateState {
  updateAvailable: boolean;
  latestVersion: string | null;
  releaseNotes: string | null;
  downloadProgress: number;
  isDownloading: boolean;
  isInstalling: boolean;
  error: string | null;

  setUpdateAvailable: (available: boolean, version?: string, notes?: string) => void;
  setDownloadProgress: (progress: number) => void;
  setDownloading: (downloading: boolean) => void;
  setInstalling: (installing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useUpdateStore = create<UpdateState>()(
  devtools(
    (set) => ({
      updateAvailable: false,
      latestVersion: null,
      releaseNotes: null,
      downloadProgress: 0,
      isDownloading: false,
      isInstalling: false,
      error: null,

      setUpdateAvailable: (available, version, notes) =>
        set({
          updateAvailable: available,
          latestVersion: version ?? null,
          releaseNotes: notes ?? null,
        }),
      setDownloadProgress: (downloadProgress) => set({ downloadProgress }),
      setDownloading: (isDownloading) => set({ isDownloading }),
      setInstalling: (isInstalling) => set({ isInstalling }),
      setError: (error) => set({ error }),
      reset: () =>
        set({
          updateAvailable: false,
          latestVersion: null,
          releaseNotes: null,
          downloadProgress: 0,
          isDownloading: false,
          isInstalling: false,
          error: null,
        }),
    }),
    { name: 'UpdateStore' }
  )
);
```

---

## 使用模式

### 选择器模式

```tsx
// ✅ 正确: 选择器模式，避免不必要的重渲染
function SkillList(): JSX.Element {
  const skills = useLibraryStore((state) => state.skills);
  const isLoading = useLibraryStore((state) => state.isLoading);
  const setSkills = useLibraryStore((state) => state.setSkills);
  // ...
}

// ✅ 正确: 批量选择
function SkillStats(): JSX.Element {
  const { skills, selectedSkill } = useLibraryStore((state) => ({
    skills: state.skills,
    selectedSkill: state.selectedSkill,
  }));
  // ...
}

// ❌ 错误: 选择整个 store
function SkillCard(): JSX.Element {
  const store = useLibraryStore(); // 任何状态变化都会触发重渲染
}
```

### 在组件外使用

```tsx
// 在非组件代码中使用
const skills = useLibraryStore.getState().skills;
useLibraryStore.getState().addSkill(newSkill);

// 订阅状态变化
const unsubscribe = useLibraryStore.subscribe((state) => {
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
    name: 'library-storage',
    partialize: (state) => ({
      categories: state.categories,
      groups: state.groups,
      // 不持久化 isLoading, error 等临时状态
    }),
  }
)
```

---

## Store 间协作

```tsx
// 部署技能后更新多个 Store
async function deploySkill(skillId: string, projectId: string) {
  const result = await deployIPC.toProject(skillId, projectId);

  if (result.success) {
    // 更新 Library Store 的部署记录
    const skill = useLibraryStore.getState().skills.find(s => s.id === skillId);
    if (skill) {
      const newDeployment: Deployment = {
        id: crypto.randomUUID(),
        skillId,
        targetScope: 'project',
        targetPath: result.data.path,
        projectId,
        deployedAt: new Date(),
      };
      useLibraryStore.getState().updateDeployments(skillId, [
        ...skill.deployments,
        newDeployment,
      ]);
    }

    // 刷新 Project Store
    const projectSkills = await projectIPC.skills(projectId);
    if (projectSkills.success) {
      useProjectStore.getState().setProjectSkills(projectId, projectSkills.data);
    }
  }
}
```
