import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Project {
  id: string;
  name: string;
  path: string;
  skillsPath: string;
  exists: boolean;
  skillCount: number;
  addedAt: Date;
  lastAccessed?: Date;
}

export interface ProjectSkill {
  id: string;
  name: string;
  folderName: string;
  version: string;
  description: string;
  path: string;
  skillMdPath: string;
  projectId: string;
  installedAt?: Date;
  size: number;
  fileCount: number;
  hasResources: boolean;
  sourceLibrarySkillId?: string;
}

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  projectSkills: Map<string, ProjectSkill[]>;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

interface ProjectActions {
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;
  selectProject: (project: Project | null) => void;
  setProjectSkills: (projectId: string, skills: ProjectSkill[]) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
}

export type ProjectStore = ProjectState & ProjectActions;

export const useProjectStore = create<ProjectStore>()(
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
        addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
        removeProject: (id) =>
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            projectSkills: (() => {
              const newMap = new Map(state.projectSkills);
              newMap.delete(id);
              return newMap;
            })(),
          })),
        selectProject: (project) => set({ selectedProject: project }),
        setProjectSkills: (projectId, skills) =>
          set((state) => {
            const newMap = new Map(state.projectSkills);
            newMap.set(projectId, skills);
            return { projectSkills: newMap };
          }),
        setLoading: (loading) => set({ isLoading: loading }),
        setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
        setError: (error) => set({ error }),
      }),
      {
        name: 'project-store',
        partialize: (state) => ({ projects: state.projects }),
      }
    ),
    { name: 'project-store' }
  )
);
