/**
 * @deprecated Use `useSkillFilter` from '@/hooks/useSkillFilter' instead.
 * This hook is kept for backward compatibility but will be removed in a future version.
 */
import { useState, useCallback, useMemo } from 'react';
import type { Skill, SortOption, SortDirection, UseSkillSortResult } from '../types';
import { getSkillDate } from '@/utils/skillHelpers';

/**
 * @deprecated Use `useSkillFilter` from '@/hooks/useSkillFilter' instead.
 */
export function useSkillSort<T extends Skill>(
  skills: T[],
  initialSortBy: SortOption = 'name',
  initialDirection: SortDirection = 'asc'
): UseSkillSortResult<T> {
  const [sortBy, setSortBy] = useState<SortOption>(initialSortBy);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);

  const sortedSkills = useMemo(() => {
    if (!Array.isArray(skills)) {
      return [];
    }

    const result = [...skills];

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
  }, [skills, sortBy, sortDirection]);

  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  return {
    sortedSkills,
    sortBy,
    setSortBy,
    sortDirection,
    toggleSortDirection,
  };
}
