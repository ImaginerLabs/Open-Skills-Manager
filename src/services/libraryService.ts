import { invokeIPC } from './ipcService';
import type { LibrarySkill } from '../stores/libraryStore';

export const libraryService = {
  list: () => invokeIPC<LibrarySkill[]>('library_list'),
  get: (id: string) => invokeIPC<LibrarySkill>('library_get', { id }),
  delete: (id: string) => invokeIPC<void>('library_delete', { id }),
  import: (options: { path: string; categoryId?: string; groupId?: string }) =>
    invokeIPC<LibrarySkill>('library_import', options),
  export: (id: string, format: 'zip' | 'folder') =>
    invokeIPC<string>('library_export', { id, format }),
};
