import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type {
  LibrarySkill,
  Deployment,
  Category,
  Group,
  ImportProgress,
  ExportProgress,
} from '@/types/skill';
export type {
  LibrarySkill,
  Deployment,
  Category,
  Group,
  ImportStatus,
  ExportStatus,
  ImportProgress,
  ExportProgress,
} from '@/types/skill';
import { initialImportProgress, initialExportProgress } from './libraryStore.initial';

interface LibraryState {
  skills: LibrarySkill[];
  categories: Category[];
  groups: Group[];
  selectedSkill: LibrarySkill | null;
  selectedCategoryId: string | undefined;
  selectedGroupId: string | undefined;
  isLoading: boolean;
  error: string | null;
  importProgress: ImportProgress;
  exportProgress: ExportProgress;
}

interface LibraryActions {
  setSkills: (skills: LibrarySkill[]) => void;
  addSkill: (skill: LibrarySkill) => void;
  removeSkill: (id: string) => void;
  updateSkill: (id: string, updates: Partial<LibrarySkill>) => void;
  selectSkill: (skill: LibrarySkill | null) => void;
  selectCategory: (categoryId: string | undefined) => void;
  selectGroup: (groupId: string | undefined) => void;
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  addGroup: (categoryId: string, group: Group) => void;
  updateGroup: (categoryId: string, groupId: string, updates: Partial<Group>) => void;
  removeGroup: (categoryId: string, groupId: string) => void;
  setGroups: (groups: Group[]) => void;
  updateDeployments: (skillId: string, deployments: Deployment[]) => void;
  addDeployment: (skillId: string, deployment: Deployment) => void;
  removeDeployment: (skillId: string, deploymentId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  // Import actions
  startImport: (total: number) => void;
  updateImportProgress: (current: number, skillName: string) => void;
  completeImport: (successful: number, failed: number, skipped: number, failedItems: ImportProgress['failedItems']) => void;
  cancelImport: () => void;
  setImportError: (error: string) => void;
  resetImport: () => void;
  // Export actions
  startExport: (total: number) => void;
  updateExportProgress: (current: number, skillName: string) => void;
  completeExport: () => void;
  cancelExport: () => void;
  setExportError: (error: string) => void;
  resetExport: () => void;
}

export type LibraryStore = LibraryState & LibraryActions;

export const useLibraryStore = create<LibraryStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        skills: [],
        categories: [],
        groups: [],
        selectedSkill: null,
        selectedCategoryId: undefined,
        selectedGroupId: undefined,
        isLoading: false,
        error: null,
        importProgress: initialImportProgress,
        exportProgress: initialExportProgress,

        // Actions
        setSkills: (skills) => set({ skills }),
        addSkill: (skill) => set((state) => ({ skills: [...state.skills, skill] })),
        removeSkill: (id) => set((state) => ({ skills: state.skills.filter((s) => s.id !== id) })),
        updateSkill: (id, updates) =>
          set((state) => ({
            skills: state.skills.map((s) => (s.id === id ? { ...s, ...updates } : s)),
          })),
        selectSkill: (skill) => set({ selectedSkill: skill }),
        selectCategory: (categoryId) => set({ selectedCategoryId: categoryId, selectedGroupId: undefined }),
        selectGroup: (groupId) => set({ selectedGroupId: groupId }),
        setCategories: (categories) => set({ categories }),
        addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
        updateCategory: (id, updates) =>
          set((state) => ({
            categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
          })),
        removeCategory: (id) =>
          set((state) => ({ categories: state.categories.filter((c) => c.id !== id) })),
        addGroup: (categoryId, group) =>
          set((state) => ({
            categories: state.categories.map((c) =>
              c.id === categoryId ? { ...c, groups: [...c.groups, group] } : c
            ),
          })),
        updateGroup: (categoryId, groupId, updates) =>
          set((state) => ({
            categories: state.categories.map((c) =>
              c.id === categoryId
                ? {
                    ...c,
                    groups: c.groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
                  }
                : c
            ),
          })),
        removeGroup: (categoryId, groupId) =>
          set((state) => ({
            categories: state.categories.map((c) =>
              c.id === categoryId
                ? { ...c, groups: c.groups.filter((g) => g.id !== groupId) }
                : c
            ),
          })),
        setGroups: (groups) => set({ groups }),
        updateDeployments: (skillId, deployments) =>
          set((state) => ({
            skills: state.skills.map((s) =>
              s.id === skillId ? { ...s, deployments } : s
            ),
          })),
        addDeployment: (skillId, deployment) =>
          set((state) => ({
            skills: state.skills.map((s) =>
              s.id === skillId
                ? { ...s, deployments: [...s.deployments, deployment] }
                : s
            ),
          })),
        removeDeployment: (skillId, deploymentId) =>
          set((state) => ({
            skills: state.skills.map((s) =>
              s.id === skillId
                ? { ...s, deployments: s.deployments.filter((d) => d.id !== deploymentId) }
                : s
            ),
          })),
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),

        // Import actions
        startImport: (total) =>
          set({
            importProgress: { ...initialImportProgress, total, status: 'importing' },
          }),
        updateImportProgress: (current, skillName) =>
          set((state) => ({
            importProgress: { ...state.importProgress, current, currentSkillName: skillName },
          })),
        completeImport: (successful, failed, skipped, failedItems) =>
          set((state) => ({
            importProgress: {
              ...state.importProgress,
              status: 'completed',
              successful,
              failed,
              skipped,
              failedItems,
            },
          })),
        cancelImport: () =>
          set((state) => ({
            importProgress: { ...state.importProgress, status: 'cancelled' },
          })),
        setImportError: (error) =>
          set((state) => ({
            importProgress: {
              ...state.importProgress,
              status: 'error',
              failedItems: [{ name: '', error, code: 'IMPORT_ERROR' }],
            },
          })),
        resetImport: () => set({ importProgress: initialImportProgress }),

        // Export actions
        startExport: (total) =>
          set({
            exportProgress: { ...initialExportProgress, total, status: 'exporting' },
          }),
        updateExportProgress: (current, skillName) =>
          set((state) => ({
            exportProgress: { ...state.exportProgress, current, currentSkillName: skillName },
          })),
        completeExport: () =>
          set((state) => ({
            exportProgress: { ...state.exportProgress, status: 'completed' },
          })),
        cancelExport: () =>
          set((state) => ({
            exportProgress: { ...state.exportProgress, status: 'cancelled' },
          })),
        setExportError: (error) =>
          set((state) => ({
            exportProgress: { ...state.exportProgress, status: 'error' },
            error,
          })),
        resetExport: () => set({ exportProgress: initialExportProgress }),
      }),
      {
        name: 'library-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          categories: state.categories,
          groups: state.groups,
        }),
        onRehydrateStorage: () => (state) => {
          // Ensure arrays are always valid after hydration
          if (state) {
            if (!Array.isArray(state.skills)) {
              state.skills = [];
            }
            if (!Array.isArray(state.categories)) {
              state.categories = [];
            }
            if (!Array.isArray(state.groups)) {
              state.groups = [];
            }
          }
        },
      }
    ),
    { name: 'library-store' }
  )
);
