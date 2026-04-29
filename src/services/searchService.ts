import { invokeIPC } from './ipcService';

export interface SearchResult {
  id: string;
  name: string;
  description: string;
  scope: 'library' | 'global' | 'project';
  path: string;
  size: number;
  fileCount: number;
  matchedSnippet?: string;
  projectId?: string;
  categoryId?: string;
}

export const searchService = {
  search: async (options: {
    query: string;
    scope?: 'library' | 'global' | 'project' | 'all';
    projectId?: string;
    categoryId?: string;
  }) => {
    console.log('[searchService] Invoking IPC search with options:', options);
    // Backend expects { options: SearchOptionsInput }
    const result = await invokeIPC<SearchResult[]>('search', { options });
    console.log('[searchService] IPC result:', result);
    return result;
  },
};
