import { invokeIPC } from './ipcService';
import type { LibrarySkill, Group, Category } from '../stores/libraryStore';

export const libraryService = {
  list: () => invokeIPC<LibrarySkill[]>('library_list'),
  get: (id: string) => invokeIPC<LibrarySkill>('library_get', { id }),
  delete: (id: string) => invokeIPC<void>('library_delete', { id }),
  import: (options: { path: string; groupId?: string | undefined; categoryId?: string | undefined }) =>
    invokeIPC<LibrarySkill>('library_import', options),
  export: async (id: string, format: 'zip' | 'folder', skillName?: string) => {
    const { save } = await import('@tauri-apps/plugin-dialog');

    if (format === 'zip') {
      const destPath = await save({
        defaultPath: `${skillName || id}.zip`,
        filters: [{ name: 'Zip', extensions: ['zip'] }],
      });
      if (!destPath) return null;
      return invokeIPC<string>('library_export', { id, format, destPath });
    } else {
      const destPath = await save({
        defaultPath: skillName || id,
      });
      if (!destPath) return null;
      return invokeIPC<string>('library_export', { id, format, destPath });
    }
  },
  exportFromPath: async (sourcePath: string, name: string, format: 'zip' | 'folder') => {
    const { save } = await import('@tauri-apps/plugin-dialog');

    if (format === 'zip') {
      const destPath = await save({
        defaultPath: `${name}.zip`,
        filters: [{ name: 'Zip', extensions: ['zip'] }],
      });
      if (!destPath) return null;
      return invokeIPC<string>('export_skill_from_path', { sourcePath, format, destPath });
    } else {
      const destPath = await save({
        defaultPath: name,
      });
      if (!destPath) return null;
      return invokeIPC<string>('export_skill_from_path', { sourcePath, format, destPath });
    }
  },
  exportBatch: async (ids: string[], defaultName?: string) => {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const destPath = await save({
      defaultPath: defaultName || 'skills-export.zip',
      filters: [{ name: 'Zip', extensions: ['zip'] }],
    });
    if (!destPath) {
      return null;
    }
    return invokeIPC<string>('library_export_batch', { ids, destPath });
  },
  organize: (skillId: string, groupId?: string, categoryId?: string) =>
    invokeIPC<void>('library_organize', { skillId, groupId, categoryId }),

  groups: {
    list: () => invokeIPC<Group[]>('library_groups_list'),
    create: (name: string, icon?: string, notes?: string) =>
      invokeIPC<Group>('library_groups_create', { name, icon, notes }),
    rename: (id: string, newName: string) =>
      invokeIPC<Group>('library_groups_rename', { id, newName }),
    delete: (id: string) => invokeIPC<void>('library_groups_delete', { id }),
  },

  categories: {
    create: (groupId: string, name: string, icon?: string, notes?: string) =>
      invokeIPC<Category>('library_categories_create', { groupId, name, icon, notes }),
    rename: (groupId: string, categoryId: string, newName: string) =>
      invokeIPC<Category>('library_categories_rename', { groupId, categoryId, newName }),
    delete: (groupId: string, categoryId: string) =>
      invokeIPC<void>('library_categories_delete', { groupId, categoryId }),
  },
};