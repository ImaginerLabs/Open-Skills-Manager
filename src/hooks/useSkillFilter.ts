import { useState, useMemo, useCallback } from 'react';
import type { Skill, SortOption, SortDirection } from '../components/features/SkillList/types';
import { filterByQuery, isValidQuery } from '../utils/search';
import { getSkillDate } from '../utils/skillHelpers';

export interface UseSkillFilterOptions {
  /** Initial sort field */
  initialSortBy?: SortOption;
  /** Initial sort direction */
  initialSortDirection?: SortDirection;
}

export interface UseSkillFilterResult<T extends Skill> {
  /** Filtered and sorted skills */
  filteredSkills: T[];
  /** Current search query */
  searchQuery: string;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Current sort field */
  sortBy: SortOption;
  /** Set sort field */
  setSortBy: (option: SortOption) => void;
  /** Current sort direction */
  sortDirection: SortDirection;
  /** Toggle sort direction */
  toggleSortDirection: () => void;
}

/**
 * Unified skill filter and sort hook
 *
 * Provides consistent search and sort behavior across Library, Global, and Project views.
 * Uses the unified filterByQuery for search.
 */
export function useSkillFilter<T extends Skill>(
  skills: T[],
  options: UseSkillFilterOptions = {}
): UseSkillFilterResult<T> {
  const {
    initialSortBy = 'name',
    initialSortDirection = 'asc',
  } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>(initialSortBy);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);

  const filteredSkills = useMemo(() => {
    if (!Array.isArray(skills)) {
      return [];
    }

    let result = [...skills];

    if (searchQuery && isValidQuery(searchQuery)) {
      result = filterByQuery(result, searchQuery);
    }

    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date': {
          const dateA = getSkillDate(a);
          const dateB = getSkillDate(b);
          comparison = new Date(dateA).getTime() - new Date(dateB).getTime();
          break;
        }
        case 'size':
          comparison = a.size - b.size;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [skills, searchQuery, sortBy, sortDirection]);

  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  return {
    filteredSkills,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    toggleSortDirection,
  };
}
