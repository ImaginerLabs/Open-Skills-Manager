import { useCallback, useMemo } from 'react';
import { projectService } from '../services/projectService';
import { useProjectStore, type Project, type ProjectSkill } from '../stores/projectStore';
import { useUIStore } from '../stores/uiStore';

export interface UseProjectsResult {
  projects: Project[];
  selectedProject: Project | null;
  projectSkills: Map<string, ProjectSkill[]>;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  listProjects: () => Promise<boolean>;
  addProjectPath: (path: string) => Promise<boolean>;
  removeProjectPath: (id: string) => Promise<boolean>;
  selectProject: (project: Project | null) => void;
  getProjectSkills: (projectId: string) => Promise<boolean>;
  refreshProject: (projectId?: string) => Promise<boolean>;
}

export function useProjects(): UseProjectsResult {
  const {
    projects,
    selectedProject,
    projectSkills,
    isLoading,
    isRefreshing,
    error,
    setProjects,
    addProject,
    removeProject,
    selectProject,
    setProjectSkills,
    setLoading,
    setRefreshing,
    setError,
  } = useProjectStore();
  const { showToast, showConfirmDialog, closeConfirmDialog } = useUIStore();

  const listProjects = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await projectService.list();
      if (result.success && result.data) {
        setProjects(result.data);
        return true;
      } else {
        const message = result.success ? 'Unknown error' : result.error.message;
        setError(message);
        showToast('error', `Failed to load projects: ${message}`);
        return false;
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      showToast('error', `Failed to load projects: ${message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setProjects, setLoading, setError, showToast]);

  const addProjectPath = useCallback(
    async (path: string): Promise<boolean> => {
      setLoading(true);
      try {
        const result = await projectService.add(path);
        if (result.success && result.data) {
          addProject(result.data);
          showToast('success', `Project "${result.data.name}" added`);
          return true;
        } else {
          const message = result.success ? 'Unknown error' : result.error.message;
          setError(message);
          showToast('error', `Failed to add project: ${message}`);
          return false;
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(message);
        showToast('error', `Failed to add project: ${message}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [addProject, setLoading, setError, showToast]
  );

  const removeProjectPath = useCallback(
    async (id: string): Promise<boolean> => {
      return new Promise((resolve) => {
        showConfirmDialog({
          title: 'Remove Project',
          message: 'Are you sure you want to remove this project? This will not delete the project files.',
          confirmText: 'Remove',
          cancelText: 'Cancel',
          onConfirm: async () => {
            closeConfirmDialog();
            setLoading(true);
            try {
              const result = await projectService.remove(id);
              if (result.success) {
                removeProject(id);
                showToast('success', 'Project removed');
                resolve(true);
              } else {
                const message = result.success ? 'Unknown error' : result.error.message;
                setError(message);
                showToast('error', `Failed to remove project: ${message}`);
                resolve(false);
              }
            } catch (e) {
              const message = e instanceof Error ? e.message : 'Unknown error';
              setError(message);
              showToast('error', `Failed to remove project: ${message}`);
              resolve(false);
            } finally {
              setLoading(false);
            }
          },
        });
      });
    },
    [removeProject, setLoading, setError, showToast, showConfirmDialog, closeConfirmDialog]
  );

  const getProjectSkills = useCallback(
    async (projectId: string): Promise<boolean> => {
      setLoading(true);
      try {
        const result = await projectService.skills(projectId);
        if (result.success && result.data) {
          setProjectSkills(projectId, result.data);
          return true;
        } else {
          const message = result.success ? 'Unknown error' : result.error.message;
          setError(message);
          showToast('error', `Failed to load project skills: ${message}`);
          return false;
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(message);
        showToast('error', `Failed to load project skills: ${message}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setProjectSkills, setLoading, setError, showToast]
  );

  const refreshProject = useCallback(
    async (projectId?: string): Promise<boolean> => {
      setRefreshing(true);
      try {
        const result = await projectService.refresh(projectId);
        if (result.success) {
          showToast('success', 'Project refreshed');
          return true;
        } else {
          const message = result.success ? 'Unknown error' : result.error.message;
          setError(message);
          showToast('error', `Failed to refresh project: ${message}`);
          return false;
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(message);
        showToast('error', `Failed to refresh project: ${message}`);
        return false;
      } finally {
        setRefreshing(false);
      }
    },
    [setRefreshing, setError, showToast]
  );

  return useMemo(
    () => ({
      projects,
      selectedProject,
      projectSkills,
      isLoading,
      isRefreshing,
      error,
      listProjects,
      addProjectPath,
      removeProjectPath,
      selectProject,
      getProjectSkills,
      refreshProject,
    }),
    [
      projects,
      selectedProject,
      projectSkills,
      isLoading,
      isRefreshing,
      error,
      listProjects,
      addProjectPath,
      removeProjectPath,
      selectProject,
      getProjectSkills,
      refreshProject,
    ]
  );
}
