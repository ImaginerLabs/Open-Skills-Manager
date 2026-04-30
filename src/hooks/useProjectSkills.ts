import { useCallback, useMemo } from 'react';
import { projectService } from '../services/projectService';
import { useProjectStore, type ProjectSkill } from '../stores/projectStore';
import { useUIStore } from '../stores/uiStore';
import type { IpcResult } from '../services/ipcService';
import type { LibrarySkill } from '../stores/libraryStore';
import type { PullOptions } from '../services/projectService';

export interface UseProjectSkillsResult {
  skills: ProjectSkill[];
  isLoading: boolean;
  error: string | null;
  loadSkills: (projectId: string) => Promise<boolean>;
  getSkill: (projectId: string, skillId: string) => Promise<IpcResult<ProjectSkill>>;
  deleteSkill: (projectId: string, skillId: string) => Promise<boolean>;
  pullSkill: (projectId: string, skillId: string, options?: PullOptions) => Promise<IpcResult<LibrarySkill>>;
}

export function useProjectSkills(projectId?: string): UseProjectSkillsResult {
  const { projectSkills, isLoading, error, setProjectSkills, setLoading, setError } = useProjectStore();
  const { showToast, showConfirmDialog, closeConfirmDialog } = useUIStore();

  const loadSkills = useCallback(
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

  const getSkill = useCallback(
    async (projectId: string, skillId: string) => {
      return await projectService.getSkill(projectId, skillId);
    },
    []
  );

  const deleteSkill = useCallback(
    async (projectId: string, skillId: string): Promise<boolean> => {
      return new Promise((resolve) => {
        showConfirmDialog({
          title: 'Delete Project Skill',
          message: 'Are you sure you want to delete this skill from the project? This action cannot be undone.',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          onConfirm: async () => {
            closeConfirmDialog();
            setLoading(true);
            try {
              const result = await projectService.deleteSkill(projectId, skillId);
              if (result.success) {
                const currentSkills = projectSkills.get(projectId) ?? [];
                const updatedSkills = currentSkills.filter((s) => s.id !== skillId);
                setProjectSkills(projectId, updatedSkills);
                showToast('success', 'Skill deleted from project');
                resolve(true);
              } else {
                const message = result.success ? 'Unknown error' : result.error.message;
                setError(message);
                showToast('error', `Failed to delete skill: ${message}`);
                resolve(false);
              }
            } catch (e) {
              const message = e instanceof Error ? e.message : 'Unknown error';
              setError(message);
              showToast('error', `Failed to delete skill: ${message}`);
              resolve(false);
            } finally {
              setLoading(false);
            }
          },
        });
      });
    },
    [projectSkills, setProjectSkills, setLoading, setError, showToast, showConfirmDialog, closeConfirmDialog]
  );

  const pullSkill = useCallback(
    async (projectId: string, skillId: string, options?: PullOptions) => {
      setLoading(true);
      try {
        const result = await projectService.pullSkill(projectId, skillId, options);
        if (result.success) {
          showToast('success', 'Skill pulled to Library');
        }
        return result;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(message);
        showToast('error', `Failed to pull skill: ${message}`);
        return {
          success: false as const,
          error: { code: 'INTERNAL_ERROR', message },
        };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, showToast]
  );

  return useMemo(
    () => ({
      skills: projectId ? (projectSkills.get(projectId) ?? []) : [],
      isLoading,
      error,
      loadSkills,
      getSkill,
      deleteSkill,
      pullSkill,
    }),
    [projectId, projectSkills, isLoading, error, loadSkills, getSkill, deleteSkill, pullSkill]
  );
}
