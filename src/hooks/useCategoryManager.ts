import { useCallback, useMemo } from 'react';
import { libraryService } from '../services/libraryService';
import { useLibraryStore } from '../stores/libraryStore';
import { useUIStore } from '../stores/uiStore';

export interface UseCategoryManagerResult {
  createGroup: (name: string) => Promise<boolean>;
  renameGroup: (groupId: string, newName: string) => Promise<boolean>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  createCategory: (groupId: string, name: string) => Promise<boolean>;
  renameCategory: (groupId: string, categoryId: string, newName: string) => Promise<boolean>;
  deleteCategory: (groupId: string, categoryId: string) => Promise<boolean>;
  loadGroups: () => Promise<boolean>;
}

export function useCategoryManager(): UseCategoryManagerResult {
  const { addGroup, updateGroup, removeGroup, addCategory, updateCategory, removeCategory, setGroups, setLoading, setError } =
    useLibraryStore();
  const { showToast, showConfirmDialog, closeConfirmDialog } = useUIStore();

  const loadGroups = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await libraryService.groups.list();
      if (result.success) {
        setGroups(result.data);
        return true;
      } else {
        setError(result.error.message);
        showToast('error', `Failed to load groups: ${result.error.message}`);
        return false;
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      showToast('error', `Failed to load groups: ${message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setGroups, setLoading, setError, showToast]);

  const createGroup = useCallback(
    async (name: string): Promise<boolean> => {
      setLoading(true);
      try {
        const result = await libraryService.groups.create(name);
        if (result.success) {
          addGroup(result.data);
          showToast('success', `Group "${name}" created`);
          return true;
        } else {
          setError(result.error.message);
          showToast('error', `Failed to create group: ${result.error.message}`);
          return false;
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(message);
        showToast('error', `Failed to create group: ${message}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [addGroup, setLoading, setError, showToast]
  );

  const renameGroup = useCallback(
    async (groupId: string, newName: string): Promise<boolean> => {
      setLoading(true);
      try {
        const result = await libraryService.groups.rename(groupId, newName);
        if (result.success) {
          updateGroup(groupId, { name: newName });
          showToast('success', `Group renamed to "${newName}"`);
          return true;
        } else {
          setError(result.error.message);
          showToast('error', `Failed to rename group: ${result.error.message}`);
          return false;
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(message);
        showToast('error', `Failed to rename group: ${message}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [updateGroup, setLoading, setError, showToast]
  );

  const deleteGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      return new Promise((resolve) => {
        showConfirmDialog({
          title: 'Delete Group',
          message: 'Are you sure you want to delete this group? Skills will be ungrouped but not deleted.',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          onConfirm: async () => {
            closeConfirmDialog();
            setLoading(true);
            try {
              const result = await libraryService.groups.delete(groupId);
              if (result.success) {
                removeGroup(groupId);
                showToast('success', 'Group deleted');
                resolve(true);
              } else {
                setError(result.error.message);
                showToast('error', `Failed to delete group: ${result.error.message}`);
                resolve(false);
              }
            } catch (e) {
              const message = e instanceof Error ? e.message : 'Unknown error';
              setError(message);
              showToast('error', `Failed to delete group: ${message}`);
              resolve(false);
            } finally {
              setLoading(false);
            }
          },
        });
      });
    },
    [removeGroup, setLoading, setError, showToast, showConfirmDialog, closeConfirmDialog]
  );

  const createCategory = useCallback(
    async (groupId: string, name: string): Promise<boolean> => {
      setLoading(true);
      try {
        const result = await libraryService.categories.create(groupId, name);
        if (result.success) {
          addCategory(groupId, result.data);
          showToast('success', `Category "${name}" created`);
          return true;
        } else {
          setError(result.error.message);
          showToast('error', `Failed to create category: ${result.error.message}`);
          return false;
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(message);
        showToast('error', `Failed to create category: ${message}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [addCategory, setLoading, setError, showToast]
  );

  const renameCategory = useCallback(
    async (groupId: string, categoryId: string, newName: string): Promise<boolean> => {
      setLoading(true);
      try {
        const result = await libraryService.categories.rename(groupId, categoryId, newName);
        if (result.success) {
          updateCategory(groupId, categoryId, { name: newName });
          showToast('success', `Category renamed to "${newName}"`);
          return true;
        } else {
          setError(result.error.message);
          showToast('error', `Failed to rename category: ${result.error.message}`);
          return false;
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(message);
        showToast('error', `Failed to rename category: ${message}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [updateCategory, setLoading, setError, showToast]
  );

  const deleteCategory = useCallback(
    async (groupId: string, categoryId: string): Promise<boolean> => {
      return new Promise((resolve) => {
        showConfirmDialog({
          title: 'Delete Category',
          message: 'Are you sure you want to delete this category? Skills will be ungrouped but not deleted.',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          onConfirm: async () => {
            closeConfirmDialog();
            setLoading(true);
            try {
              const result = await libraryService.categories.delete(groupId, categoryId);
              if (result.success) {
                removeCategory(groupId, categoryId);
                showToast('success', 'Category deleted');
                resolve(true);
              } else {
                setError(result.error.message);
                showToast('error', `Failed to delete category: ${result.error.message}`);
                resolve(false);
              }
            } catch (e) {
              const message = e instanceof Error ? e.message : 'Unknown error';
              setError(message);
              showToast('error', `Failed to delete category: ${message}`);
              resolve(false);
            } finally {
              setLoading(false);
            }
          },
        });
      });
    },
    [removeCategory, setLoading, setError, showToast, showConfirmDialog, closeConfirmDialog]
  );

  return useMemo(
    () => ({
      createGroup,
      renameGroup,
      deleteGroup,
      createCategory,
      renameCategory,
      deleteCategory,
      loadGroups,
    }),
    [createGroup, renameGroup, deleteGroup, createCategory, renameCategory, deleteCategory, loadGroups]
  );
}