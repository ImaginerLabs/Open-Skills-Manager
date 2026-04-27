import { useState, useMemo, useCallback } from 'react';
import type { GlobalSkill } from '../stores/globalStore';

export type SortBy = 'name' | 'date' | 'size';
export type SortDirection = 'asc' | 'desc';

export function useGlobalFilters(skills: GlobalSkill[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const filteredSkills = useMemo(() => {
    let result = [...skills];

    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (skill) =>
          skill.name.toLowerCase().includes(lowerQuery) ||
          skill.description.toLowerCase().includes(lowerQuery) ||
          skill.folderName.toLowerCase().includes(lowerQuery)
      );
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
          comparison = dateA - dateB; // Oldest to newest
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

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    toggleSortDirection,
    filteredSkills,
  };
}
