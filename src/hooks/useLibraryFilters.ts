import { useCallback, useMemo, useState } from 'react';
import type { LibrarySkill } from '../stores/libraryStore';
import { ALL_GROUP_ID } from '../components/features/CategoryManager/CategoryManager';
import { filterByQuery, isValidQuery } from '../utils/search';
import type { SortOption, SortDirection } from '../components/features/SkillList/types';

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

/**
 * Library-specific filter hook
 *
 * Extends basic search/sort with group and category filtering.
 * Uses unified filterByQuery for search.
 */
export function useLibraryFilters(
  skills: LibrarySkill[],
  selectedGroupId: string | null | undefined,
  selectedCategoryId: string | null | undefined
): UseLibraryFiltersResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filteredSkills = useMemo(() => {
    if (!Array.isArray(skills)) {
      return [];
    }
    let result = [...skills];

    if (searchQuery && isValidQuery(searchQuery)) {
      result = filterByQuery(result, searchQuery);
    }

    if (selectedGroupId && selectedGroupId !== ALL_GROUP_ID) {
      result = result.filter((skill) => skill.groupId === selectedGroupId);
    }

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

  return useMemo(() => ({
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    toggleSortDirection,
    filteredSkills,
  }), [searchQuery, sortBy, sortDirection, toggleSortDirection, filteredSkills]);
}

export type { UseLibraryFiltersResult };
