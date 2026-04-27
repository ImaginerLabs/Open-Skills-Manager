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
  lastScannedAt?: Date;
}

export interface ProjectSkill {
  id: string;
  name: string;
  folderName: string;
  version: string;
  description: string;
  path: string;
  skillMdPath: string;
  skillMdContent?: string;
  skillMdLines: number;
  skillMdChars: number;
  projectId: string;
  installedAt: string;
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
  refreshingProjectId: string | null;
  lastRefreshAt: Map<string, Date>;
  refreshError: string | null;
  error: string | null;
}

interface ProjectActions {
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;
  selectProject: (project: Project | null) => void;
  setProjectSkills: (projectId: string, skills: ProjectSkill[]) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean, projectId?: string) => void;
  setRefreshError: (error: string | null) => void;
  setError: (error: string | null) => void;
  clearProjectSkills: (projectId: string) => void;
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
        refreshingProjectId: null,
        lastRefreshAt: new Map(),
        refreshError: null,
        error: null,

        setProjects: (projects) => set({ projects }),
        addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
        removeProject: (id) =>
          set((state) => {
            const newSkillsMap = new Map(state.projectSkills);
            newSkillsMap.delete(id);
            const newRefreshMap = new Map(state.lastRefreshAt);
            newRefreshMap.delete(id);
            return {
              projects: state.projects.filter((p) => p.id !== id),
              projectSkills: newSkillsMap,
              lastRefreshAt: newRefreshMap,
              selectedProject: state.selectedProject?.id === id ? null : state.selectedProject,
            };
          }),
        selectProject: (project) => set({ selectedProject: project }),
        setProjectSkills: (projectId, skills) =>
          set((state) => {
            const newMap = new Map(state.projectSkills);
            newMap.set(projectId, skills);
            const newRefreshMap = new Map(state.lastRefreshAt);
            newRefreshMap.set(projectId, new Date());
            return { projectSkills: newMap, lastRefreshAt: newRefreshMap };
          }),
        setLoading: (loading) => set({ isLoading: loading }),
        setRefreshing: (refreshing, projectId) =>
          set({ isRefreshing: refreshing, refreshingProjectId: projectId ?? null }),
        setRefreshError: (error) => set({ refreshError: error }),
        setError: (error) => set({ error }),
        clearProjectSkills: (projectId) =>
          set((state) => {
            const newMap = new Map(state.projectSkills);
            newMap.delete(projectId);
            return { projectSkills: newMap };
          }),
      }),
      {
        name: 'project-store',
        partialize: (state) => ({ projects: state.projects }),
      }
    ),
    { name: 'project-store' }
  )
);
