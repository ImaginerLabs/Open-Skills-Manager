import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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

interface LibraryState {
  skills: LibrarySkill[];
  categories: Category[];
  groups: Group[];
  selectedSkill: LibrarySkill | null;
  isLoading: boolean;
  error: string | null;
}

interface LibraryActions {
  setSkills: (skills: LibrarySkill[]) => void;
  addSkill: (skill: LibrarySkill) => void;
  removeSkill: (id: string) => void;
  updateSkill: (id: string, updates: Partial<LibrarySkill>) => void;
  selectSkill: (skill: LibrarySkill | null) => void;
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  removeCategory: (id: string) => void;
  updateDeployments: (skillId: string, deployments: Deployment[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export type LibraryStore = LibraryState & LibraryActions;

export const useLibraryStore = create<LibraryStore>()(
  devtools(
    (set) => ({
      // Initial state
      skills: [],
      categories: [],
      groups: [],
      selectedSkill: null,
      isLoading: false,
      error: null,

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
      removeCategory: (id) =>
        set((state) => ({ categories: state.categories.filter((c) => c.id !== id) })),
      updateDeployments: (skillId, deployments) =>
        set((state) => ({
          skills: state.skills.map((s) =>
            s.id === skillId ? { ...s, deployments } : s
          ),
        })),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    { name: 'library-store' }
  )
);
