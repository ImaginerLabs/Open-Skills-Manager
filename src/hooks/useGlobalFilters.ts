/**
 * @deprecated Use `useSkillFilter` from './useSkillFilter' instead.
 * This hook is kept for backward compatibility but will be removed in a future version.
 */
import { useState, useMemo, useCallback } from 'react';
import type { GlobalSkill } from '../stores/globalStore';
import { filterByQuery, isValidQuery } from '../utils/search';
import type { SortOption, SortDirection } from '../components/features/SkillList/types';

export type SortBy = SortOption;
export { type SortDirection };

/**
 * @deprecated Use `useSkillFilter` from './useSkillFilter' instead.
 */
export function useGlobalFilters(skills: GlobalSkill[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const filteredSkills = useMemo(() => {
    let result = [...skills];

    // Filter by search query using unified search logic
    if (searchQuery && isValidQuery(searchQuery)) {
      result = filterByQuery(result, searchQuery);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date': {
          const dateA = a.installedAt ? new Date(a.installedAt).getTime() : 0;
          const dateB = b.installedAt ? new Date(b.installedAt).getTime() : 0;
          comparison = dateA - dateB;
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

  return useMemo(() => ({
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    toggleSortDirection,
    filteredSkills,
  }), [searchQuery, sortBy, sortDirection, toggleSortDirection, filteredSkills]);
}
