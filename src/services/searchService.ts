import { invokeIPC } from './ipcService';

export interface SearchResult {
  id: string;
  name: string;
  description: string;
  scope: 'library' | 'global' | 'project';
  matchedSnippet?: string;
  projectId?: string;
}

export const searchService = {
  search: (options: {
    query: string;
    scope?: 'library' | 'global' | 'project' | 'all';
    projectId?: string;
    categoryId?: string;
  }) => invokeIPC<SearchResult[]>('search', options),
};
