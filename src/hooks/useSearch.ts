import { useEffect, useCallback, useRef } from 'react';
import { useUIStore, GroupedSearchResults, SearchResult } from '@/stores/uiStore';
import { searchService } from '@/services/searchService';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export interface UseSearchResult {
  search: (query: string) => void;
  clearResults: () => void;
  isSearching: boolean;
  results: GroupedSearchResults | null;
}

function groupResults(results: SearchResult[]): GroupedSearchResults {
  const grouped: GroupedSearchResults = {
    library: [],
    global: [],
    projects: {},
  };

  for (const result of results) {
    if (result.scope === 'library') {
      grouped.library.push(result);
    } else if (result.scope === 'global') {
      grouped.global.push(result);
    } else if (result.scope === 'project' && result.projectId) {
      const projectId = result.projectId;
      if (!grouped.projects[projectId]) {
        grouped.projects[projectId] = [];
      }
      grouped.projects[projectId].push(result);
    }
  }

  return grouped;
}

export function useSearch(): UseSearchResult {
  const searchState = useUIStore((state) => state.search);
  const searchActions = useUIStore((state) => state.searchActions);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const performSearch = useCallback(async (query: string) => {
    console.log('[useSearch] performSearch called with query:', query);

    if (abortController.current) {
      abortController.current.abort();
    }

    if (query.length < MIN_QUERY_LENGTH) {
      console.log('[useSearch] Query too short, clearing results');
      searchActions.setSearchResults(null);
      searchActions.setSearching(false);
      return;
    }

    abortController.current = new AbortController();
    searchActions.setSearching(true);

    const searchOptions: {
      query: string;
      scope?: 'library' | 'global' | 'project' | 'all';
      projectId?: string;
      categoryId?: string;
    } = {
      query,
      scope: searchState.searchScope,
    };

    if (searchState.selectedProjectId) {
      searchOptions.projectId = searchState.selectedProjectId;
    }
    if (searchState.selectedCategoryId) {
      searchOptions.categoryId = searchState.selectedCategoryId;
    }

    console.log('[useSearch] Calling searchService.search with options:', searchOptions);

    try {
      const result = await searchService.search(searchOptions);

      console.log('[useSearch] Search result:', result);

      if (result.success) {
        const grouped = groupResults(result.data);
        console.log('[useSearch] Grouped results:', grouped);
        searchActions.setSearchResults(grouped);
      } else {
        console.error('[useSearch] Search failed:', result.error);
        searchActions.setSearchResults(null);
      }
    } catch (error) {
      console.error('[useSearch] Search exception:', error);
      if (!abortController.current?.signal.aborted) {
        searchActions.setSearchResults(null);
      }
    } finally {
      if (!abortController.current?.signal.aborted) {
        searchActions.setSearching(false);
      }
    }
  }, [searchState.searchScope, searchState.selectedProjectId, searchState.selectedCategoryId, searchActions]);

  const search = useCallback((query: string) => {
    searchActions.setSearchQuery(query);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, DEBOUNCE_MS);
  }, [performSearch, searchActions]);

  const clearResults = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (abortController.current) {
      abortController.current.abort();
    }
    searchActions.setSearchResults(null);
    searchActions.setSearching(false);
  }, [searchActions]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
    search,
    clearResults,
    isSearching: searchState.isSearching,
    results: searchState.searchResults,
  };
}
