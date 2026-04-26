import { invokeIPC } from './ipcService';
import type { LibrarySkill, Category, Group } from '../stores/libraryStore';

export const libraryService = {
  list: () => invokeIPC<LibrarySkill[]>('library_list'),
  get: (id: string) => invokeIPC<LibrarySkill>('library_get', { id }),
  delete: (id: string) => invokeIPC<void>('library_delete', { id }),
  import: (options: { path: string; categoryId?: string; groupId?: string }) =>
    invokeIPC<LibrarySkill>('library_import', options),
  export: async (id: string, format: 'zip' | 'folder', skillName?: string) => {
    const { save } = await import('@tauri-apps/plugin-dialog');

    if (format === 'zip') {
      const destPath = await save({
        defaultPath: `${skillName || id}.zip`,
        filters: [{ name: 'Zip', extensions: ['zip'] }],
      });
      if (!destPath) return null;
      return invokeIPC<string>('library_export', { id, format, dest_path: destPath });
    } else {
      const destPath = await save({
        defaultPath: skillName || id,
      });
      if (!destPath) return null;
      return invokeIPC<string>('library_export', { id, format, dest_path: destPath });
    }
  },
  exportBatch: async (ids: string[], defaultName?: string) => {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const result = await save({
      defaultPath: defaultName || 'skills-export.zip',
      filters: [{ name: 'Zip', extensions: ['zip'] }],
    });
    if (!result) {
      return null;
    }
    return invokeIPC<string>('library_export_batch', { ids, dest_path: result });
  },
  organize: (skillId: string, categoryId?: string, groupId?: string) =>
    invokeIPC<void>('library_organize', { skillId, categoryId, groupId }),

  categories: {
    list: () => invokeIPC<Category[]>('library_categories_list'),
    create: (name: string, icon?: string, color?: string) =>
      invokeIPC<Category>('library_categories_create', { name, icon, color }),
    rename: (id: string, newName: string) =>
      invokeIPC<Category>('library_categories_rename', { id, newName }),
    delete: (id: string) => invokeIPC<void>('library_categories_delete', { id }),
  },

  groups: {
    create: (categoryId: string, name: string) =>
      invokeIPC<Group>('library_groups_create', { categoryId, name }),
    rename: (categoryId: string, groupId: string, newName: string) =>
      invokeIPC<Group>('library_groups_rename', { categoryId, groupId, newName }),
    delete: (categoryId: string, groupId: string) =>
      invokeIPC<void>('library_groups_delete', { categoryId, groupId }),
  },
};
