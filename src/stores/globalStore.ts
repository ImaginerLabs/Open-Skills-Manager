import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface GlobalSkill {
  id: string;
  name: string;
  folderName: string;
  version: string;
  description: string;
  path: string;
  skillMdPath: string;
  installedAt?: Date;
  size: number;
  fileCount: number;
  hasResources: boolean;
  sourceLibrarySkillId?: string;
}

interface GlobalState {
  skills: GlobalSkill[];
  selectedSkill: GlobalSkill | null;
  isLoading: boolean;
  error: string | null;
}

interface GlobalActions {
  setSkills: (skills: GlobalSkill[]) => void;
  addSkill: (skill: GlobalSkill) => void;
  removeSkill: (id: string) => void;
  selectSkill: (skill: GlobalSkill | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export type GlobalStore = GlobalState & GlobalActions;

export const useGlobalStore = create<GlobalStore>()(
  devtools(
    (set) => ({
      skills: [],
      selectedSkill: null,
      isLoading: false,
      error: null,

      setSkills: (skills) => set({ skills }),
      addSkill: (skill) => set((state) => ({ skills: [...state.skills, skill] })),
      removeSkill: (id) => set((state) => ({ skills: state.skills.filter((s) => s.id !== id) })),
      selectSkill: (skill) => set({ selectedSkill: skill }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    { name: 'global-store' }
  )
);
