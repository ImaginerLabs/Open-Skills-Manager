import { invokeIPC } from './ipcService';
import { logService, LOG_MODULES } from './logService';

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
    logService.debug(LOG_MODULES.SYSTEM, 'SEARCH_START', 'Invoking IPC search', {
      scope: options.scope,
      projectId: options.projectId,
      categoryId: options.categoryId,
    });
    // Backend expects { options: SearchOptionsInput }
    const result = await invokeIPC<SearchResult[]>('search', { options });
    logService.debug(LOG_MODULES.SYSTEM, 'SEARCH_RESULT', 'IPC result received', {
      success: result.success,
      count: result.success ? result.data.length : 0,
    });
    return result;
  },
};
