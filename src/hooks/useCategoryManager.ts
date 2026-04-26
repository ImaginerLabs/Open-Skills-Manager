import { useCallback, useMemo } from 'react';
import { libraryService } from '../services/libraryService';
import { useLibraryStore } from '../stores/libraryStore';
import { useUIStore } from '../stores/uiStore';

export interface UseCategoryManagerResult {
  createCategory: (name: string) => Promise<boolean>;
  renameCategory: (categoryId: string, newName: string) => Promise<boolean>;
  deleteCategory: (categoryId: string) => Promise<boolean>;
  createGroup: (categoryId: string, name: string) => Promise<boolean>;
  renameGroup: (categoryId: string, groupId: string, newName: string) => Promise<boolean>;
  deleteGroup: (categoryId: string, groupId: string) => Promise<boolean>;
  loadCategories: () => Promise<boolean>;
}

export function useCategoryManager(): UseCategoryManagerResult {
  const { addCategory, updateCategory, removeCategory, addGroup, updateGroup, removeGroup, setCategories, setLoading, setError } =
    useLibraryStore();
  const { showToast, showConfirmDialog, closeConfirmDialog } = useUIStore();

  const loadCategories = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await libraryService.categories.list();
      if (result.success) {
        setCategories(result.data);
        return true;
      } else {
        setError(result.error.message);
        showToast('error', `Failed to load categories: ${result.error.message}`);
        return false;
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      showToast('error', `Failed to load categories: ${message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setCategories, setLoading, setError, showToast]);

  const createCategory = useCallback(
    async (name: string): Promise<boolean> => {
      setLoading(true);
      try {
        const result = await libraryService.categories.create(name);
        if (result.success) {
          addCategory(result.data);
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
    async (categoryId: string, newName: string): Promise<boolean> => {
      setLoading(true);
      try {
        const result = await libraryService.categories.rename(categoryId, newName);
        if (result.success) {
          updateCategory(categoryId, { name: newName });
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
    async (categoryId: string): Promise<boolean> => {
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
              const result = await libraryService.categories.delete(categoryId);
              if (result.success) {
                removeCategory(categoryId);
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

  const createGroup = useCallback(
    async (categoryId: string, name: string): Promise<boolean> => {
      setLoading(true);
      try {
        const result = await libraryService.groups.create(categoryId, name);
        if (result.success) {
          addGroup(categoryId, result.data);
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
    async (categoryId: string, groupId: string, newName: string): Promise<boolean> => {
      setLoading(true);
      try {
        const result = await libraryService.groups.rename(categoryId, groupId, newName);
        if (result.success) {
          updateGroup(categoryId, groupId, { name: newName });
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
    async (categoryId: string, groupId: string): Promise<boolean> => {
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
              const result = await libraryService.groups.delete(categoryId, groupId);
              if (result.success) {
                removeGroup(categoryId, groupId);
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

  return useMemo(
    () => ({
      createCategory,
      renameCategory,
      deleteCategory,
      createGroup,
      renameGroup,
      deleteGroup,
      loadCategories,
    }),
    [createCategory, renameCategory, deleteCategory, createGroup, renameGroup, deleteGroup, loadCategories]
  );
}
