import { useCallback, useMemo, useState } from 'react';
import type { LibrarySkill } from '../stores/libraryStore';
import { ALL_CATEGORY_ID } from '../components/features/CategoryManager/CategoryManager';

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

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (skill) =>
          skill.name.toLowerCase().includes(query) ||
          skill.description.toLowerCase().includes(query)
      );
    }

    // Filter by category, but skip filtering for "All" category
    if (selectedCategoryId && selectedCategoryId !== ALL_CATEGORY_ID) {
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
  }, [skills, searchQuery, selectedCategoryId, sortBy, sortDirection]);

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
