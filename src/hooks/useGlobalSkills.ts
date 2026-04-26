import { useCallback, useMemo } from 'react';
import { globalService } from '../services/globalService';
import { useGlobalStore, type GlobalSkill } from '../stores/globalStore';
import { useUIStore } from '../stores/uiStore';
import type { IpcResult } from '../services/ipcService';

export interface UseGlobalSkillsResult {
  skills: GlobalSkill[];
  selectedSkill: GlobalSkill | null;
  isLoading: boolean;
  listGlobalSkills: () => Promise<boolean>;
  getGlobalSkill: (id: string) => Promise<IpcResult<GlobalSkill>>;
  deleteGlobalSkill: (id: string) => Promise<boolean>;
  pullGlobalSkill: (id: string) => Promise<boolean>;
  selectSkill: (skill: GlobalSkill | null) => void;
}

export function useGlobalSkills(): UseGlobalSkillsResult {
  const { skills, selectedSkill, isLoading, setSkills, removeSkill, selectSkill, setLoading, setError } =
    useGlobalStore();
  const { showToast, showConfirmDialog, closeConfirmDialog } = useUIStore();

  const listGlobalSkills = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await globalService.list();
      if (result.success) {
        setSkills(result.data);
        return true;
      } else {
        setError(result.error.message);
        showToast('error', `Failed to load global skills: ${result.error.message}`);
        return false;
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      showToast('error', `Failed to load global skills: ${message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setSkills, setLoading, setError, showToast]);

  const getGlobalSkill = useCallback(
    async (id: string) => {
      return await globalService.get(id);
    },
    []
  );

  const deleteGlobalSkill = useCallback(
    async (id: string): Promise<boolean> => {
      return new Promise((resolve) => {
        showConfirmDialog({
          title: 'Delete Global Skill',
          message: 'Are you sure you want to delete this global skill? This action cannot be undone.',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          onConfirm: async () => {
            closeConfirmDialog();
            setLoading(true);
            try {
              const result = await globalService.delete(id);
              if (result.success) {
                removeSkill(id);
                showToast('success', 'Global skill deleted');
                resolve(true);
              } else {
                setError(result.error.message);
                showToast('error', `Failed to delete global skill: ${result.error.message}`);
                resolve(false);
              }
            } catch (e) {
              const message = e instanceof Error ? e.message : 'Unknown error';
              setError(message);
              showToast('error', `Failed to delete global skill: ${message}`);
              resolve(false);
            } finally {
              setLoading(false);
            }
          },
        });
      });
    },
    [removeSkill, setLoading, setError, showToast, showConfirmDialog, closeConfirmDialog]
  );

  const pullGlobalSkill = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      try {
        const result = await globalService.pull(id);
        if (result.success) {
          showToast('success', 'Global skill pulled successfully');
          return true;
        } else {
          setError(result.error.message);
          showToast('error', `Failed to pull global skill: ${result.error.message}`);
          return false;
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(message);
        showToast('error', `Failed to pull global skill: ${message}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, showToast]
  );

  return useMemo(
    () => ({
      skills,
      selectedSkill,
      isLoading,
      listGlobalSkills,
      getGlobalSkill,
      deleteGlobalSkill,
      pullGlobalSkill,
      selectSkill,
    }),
    [skills, selectedSkill, isLoading, listGlobalSkills, getGlobalSkill, deleteGlobalSkill, pullGlobalSkill, selectSkill]
  );
}
