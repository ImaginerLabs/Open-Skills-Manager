import { describe, it, expect } from 'vitest';
import { useGlobalFilters } from './useGlobalFilters';
import { renderHook, act } from '@testing-library/react';
import type { GlobalSkill } from '../stores/globalStore';

const mockSkills: GlobalSkill[] = [
  {
    id: 'skill-1',
    name: 'Alpha Skill',
    folderName: 'alpha-skill',
    version: '1.0.0',
    description: 'First skill in the list',
    path: '/path/alpha',
    skillMdPath: '/path/alpha/SKILL.md',
    installedAt: new Date('2024-01-01'),
    size: 1000,
    fileCount: 1,
    hasResources: false,
  },
  {
    id: 'skill-2',
    name: 'Beta Skill',
    folderName: 'beta-skill',
    version: '2.0.0',
    description: 'Second skill in the list',
    path: '/path/beta',
    skillMdPath: '/path/beta/SKILL.md',
    installedAt: new Date('2024-06-01'),
    size: 5000,
    fileCount: 2,
    hasResources: false,
  },
  {
    id: 'skill-3',
    name: 'Zeta Skill',
    folderName: 'zeta-skill',
    version: '3.0.0',
    description: 'Third skill in the list',
    path: '/path/zeta',
    skillMdPath: '/path/zeta/SKILL.md',
    installedAt: new Date('2024-12-01'),
    size: 10000,
    fileCount: 3,
    hasResources: false,
  },
];

describe('useGlobalFilters', () => {
  it('returns all skills when no filters applied', () => {
    const { result } = renderHook(() => useGlobalFilters(mockSkills));

    expect(result.current.filteredSkills).toHaveLength(3);
  });

  it('filters skills by search query', () => {
    const { result } = renderHook(() => useGlobalFilters(mockSkills));

    act(() => {
      result.current.setSearchQuery('Alpha');
    });

    expect(result.current.filteredSkills).toHaveLength(1);
    expect(result.current.filteredSkills[0]?.name).toBe('Alpha Skill');
  });

  it('filters skills by description', () => {
    const { result } = renderHook(() => useGlobalFilters(mockSkills));

    act(() => {
      result.current.setSearchQuery('Second');
    });

    expect(result.current.filteredSkills).toHaveLength(1);
    expect(result.current.filteredSkills[0]?.name).toBe('Beta Skill');
  });

  it('filters skills by folder name', () => {
    const { result } = renderHook(() => useGlobalFilters(mockSkills));

    act(() => {
      result.current.setSearchQuery('zeta-skill');
    });

    expect(result.current.filteredSkills).toHaveLength(1);
    expect(result.current.filteredSkills[0]?.name).toBe('Zeta Skill');
  });

  it('sorts skills by name ascending', () => {
    const { result } = renderHook(() => useGlobalFilters(mockSkills));

    act(() => {
      result.current.setSortBy('name');
      result.current.toggleSortDirection(); // asc
    });

    expect(result.current.filteredSkills[0]?.name).toBe('Alpha Skill');
    expect(result.current.filteredSkills[2]?.name).toBe('Zeta Skill');
  });

  it('sorts skills by name descending', () => {
    const { result } = renderHook(() => useGlobalFilters(mockSkills));

    act(() => {
      result.current.setSortBy('name');
    });

    // Default is desc
    expect(result.current.filteredSkills[0]?.name).toBe('Zeta Skill');
    expect(result.current.filteredSkills[2]?.name).toBe('Alpha Skill');
  });

  it('sorts skills by date ascending', () => {
    const { result } = renderHook(() => useGlobalFilters(mockSkills));

    act(() => {
      result.current.setSortBy('date');
      result.current.toggleSortDirection(); // asc
    });

    expect(result.current.filteredSkills[0]?.name).toBe('Alpha Skill');
    expect(result.current.filteredSkills[2]?.name).toBe('Zeta Skill');
  });

  it('sorts skills by date descending (newest first)', () => {
    const { result } = renderHook(() => useGlobalFilters(mockSkills));

    act(() => {
      result.current.setSortBy('date');
    });

    // Default is desc (newest first)
    expect(result.current.filteredSkills[0]?.name).toBe('Zeta Skill');
    expect(result.current.filteredSkills[2]?.name).toBe('Alpha Skill');
  });

  it('sorts skills by size ascending', () => {
    const { result } = renderHook(() => useGlobalFilters(mockSkills));

    act(() => {
      result.current.setSortBy('size');
      result.current.toggleSortDirection(); // asc
    });

    expect(result.current.filteredSkills[0]?.name).toBe('Alpha Skill');
    expect(result.current.filteredSkills[2]?.name).toBe('Zeta Skill');
  });

  it('sorts skills by size descending (largest first)', () => {
    const { result } = renderHook(() => useGlobalFilters(mockSkills));

    act(() => {
      result.current.setSortBy('size');
    });

    // Default is desc (largest first)
    expect(result.current.filteredSkills[0]?.name).toBe('Zeta Skill');
    expect(result.current.filteredSkills[2]?.name).toBe('Alpha Skill');
  });

  it('combines search and sort', () => {
    const { result } = renderHook(() => useGlobalFilters(mockSkills));

    act(() => {
      result.current.setSearchQuery('Skill');
      result.current.setSortBy('name');
      result.current.toggleSortDirection(); // asc
    });

    expect(result.current.filteredSkills).toHaveLength(3);
    expect(result.current.filteredSkills[0]?.name).toBe('Alpha Skill');
  });

  it('returns empty array when search matches nothing', () => {
    const { result } = renderHook(() => useGlobalFilters(mockSkills));

    act(() => {
      result.current.setSearchQuery('NonExistent');
    });

    expect(result.current.filteredSkills).toHaveLength(0);
  });

  it('handles skills without installedAt', () => {
    const skillsNoDate: GlobalSkill[] = mockSkills.map((s) => {
      const { installedAt: _, ...rest } = s;
      return rest;
    });
    const { result } = renderHook(() => useGlobalFilters(skillsNoDate));

    act(() => {
      result.current.setSortBy('date');
    });

    expect(result.current.filteredSkills).toHaveLength(3);
  });

  it('toggles sort direction', () => {
    const { result } = renderHook(() => useGlobalFilters(mockSkills));

    expect(result.current.sortDirection).toBe('desc');

    act(() => {
      result.current.toggleSortDirection();
    });

    expect(result.current.sortDirection).toBe('asc');

    act(() => {
      result.current.toggleSortDirection();
    });

    expect(result.current.sortDirection).toBe('desc');
  });
});