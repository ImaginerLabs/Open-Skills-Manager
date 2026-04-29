import { useCallback, useMemo, useState } from 'react';
import type { LibrarySkill } from '../stores/libraryStore';
import { ALL_GROUP_ID } from '../components/features/CategoryManager/CategoryManager';
import { filterByQuery, isValidQuery } from '../utils/search';

type SortOption = 'name' | 'date' | 'size';
type SortDirection = 'asc' | 'desc';

interface UseLibraryFiltersResult {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: SortOption;
  setSortBy: (option: SortOption) => void;
  sortDirection: SortDirection;
  setSortDirection: (direction: SortDirection) => void;
  toggleSortDirection: () => void;
  filteredSkills: LibrarySkill[];
}

export function useLibraryFilters(
  skills: LibrarySkill[],
  selectedGroupId: string | null | undefined,
  selectedCategoryId: string | null | undefined
): UseLibraryFiltersResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filteredSkills = useMemo(() => {
    // Defensive check: ensure skills is an array
    if (!Array.isArray(skills)) {
      return [];
    }
    let result = [...skills];

    // Filter by search query using unified search logic
    if (searchQuery && isValidQuery(searchQuery)) {
      result = filterByQuery(result, searchQuery);
    }

    // Filter by group, but skip filtering for "All" group
    if (selectedGroupId && selectedGroupId !== ALL_GROUP_ID) {
      result = result.filter((skill) => skill.groupId === selectedGroupId);
    }

    // Filter by category if selected
    if (selectedCategoryId) {
      result = result.filter((skill) => skill.categoryId === selectedCategoryId);
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison =
            new Date(a.importedAt).getTime() - new Date(b.importedAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [skills, searchQuery, selectedGroupId, selectedCategoryId, sortBy, sortDirection]);

  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    toggleSortDirection,
    filteredSkills,
  };
}

export type { SortOption, SortDirection, UseLibraryFiltersResult };
