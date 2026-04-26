import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

export interface LibrarySkill {
  id: string;
  name: string;
  folderName: string;
  version: string;
  description: string;
  path: string;
  skillMdPath: string;
  categoryId?: string;
  groupId?: string;
  importedAt: Date;
  updatedAt?: Date;
  size: number;
  fileCount: number;
  hasResources: boolean;
  deployments: Deployment[];
}

export interface Deployment {
  id: string;
  skillId: string;
  targetScope: 'global' | 'project';
  targetPath: string;
  projectName?: string;
  deployedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  groups: Group[];
  skillCount: number;
  isCustom: boolean;
  createdAt: Date;
}

export interface Group {
  id: string;
  categoryId: string;
  name: string;
  skillCount: number;
  isCustom: boolean;
  createdAt: Date;
}

export type ImportStatus = 'idle' | 'importing' | 'completed' | 'cancelled' | 'error';
export type ExportStatus = 'idle' | 'exporting' | 'completed' | 'cancelled' | 'error';

export interface ImportProgress {
  current: number;
  total: number;
  currentSkillName: string;
  status: ImportStatus;
  successful: number;
  failed: number;
  skipped: number;
  failedItems: Array<{ name: string; error: string; code: string }>;
}

export interface ExportProgress {
  current: number;
  total: number;
  currentSkillName: string;
  status: ExportStatus;
}

const initialImportProgress: ImportProgress = {
  current: 0,
  total: 0,
  currentSkillName: '',
  status: 'idle',
  successful: 0,
  failed: 0,
  skipped: 0,
  failedItems: [],
};

const initialExportProgress: ExportProgress = {
  current: 0,
  total: 0,
  currentSkillName: '',
  status: 'idle',
};

interface LibraryState {
  skills: LibrarySkill[];
  categories: Category[];
  groups: Group[];
  selectedSkill: LibrarySkill | null;
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
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  addGroup: (categoryId: string, group: Group) => void;
  updateGroup: (categoryId: string, groupId: string, updates: Partial<Group>) => void;
  removeGroup: (categoryId: string, groupId: string) => void;
  setGroups: (groups: Group[]) => void;
  updateDeployments: (skillId: string, deployments: Deployment[]) => void;
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
      }
    ),
    { name: 'library-store' }
  )
);
