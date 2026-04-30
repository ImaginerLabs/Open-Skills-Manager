import { useCallback, useMemo } from 'react';
import { useLibraryStore } from '../stores/libraryStore';
import { useGlobalStore } from '../stores/globalStore';
import { useProjectStore } from '../stores/projectStore';
import { libraryService } from '../services/libraryService';
import { globalService } from '../services/globalService';
import { projectService } from '../services/projectService';
import { ideService } from '../services/ideService';

export interface UseSidebarDataResult {
  refreshAll: (ideId?: string) => Promise<void>;
  refreshLibrary: () => Promise<void>;
  refreshGlobal: (ideId?: string) => Promise<void>;
  refreshProjects: (ideId?: string) => Promise<void>;
}

/**
 * Hook for managing sidebar data refresh.
 * Provides methods to refresh all or specific data sources.
 * Supports optional ideId parameter for IDE-specific refresh.
 */
export function useSidebarData(): UseSidebarDataResult {
  const setLibrarySkills = useLibraryStore((state) => state.setSkills);
  const setGroups = useLibraryStore((state) => state.setGroups);
  const setGlobalSkills = useGlobalStore((state) => state.setSkills);
  const setProjects = useProjectStore((state) => state.setProjects);

  const refreshLibrary = useCallback(async () => {
    try {
      const [skillsResult, groupsResult] = await Promise.all([
        libraryService.list(),
        libraryService.groups.list(),
      ]);

      if (skillsResult.success) {
        setLibrarySkills(skillsResult.data);
      }
      if (groupsResult.success) {
        setGroups(groupsResult.data);
      }
    } catch (error) {
      console.error('[useSidebarData] Failed to refresh library:', error);
    }
  }, [setLibrarySkills, setGroups]);

  const refreshGlobal = useCallback(async (ideId?: string) => {
    try {
      const result = ideId
        ? await ideService.getGlobalSkills(ideId)
        : await globalService.list();
      if (result.success) {
        setGlobalSkills(result.data);
      }
    } catch (error) {
      console.error('[useSidebarData] Failed to refresh global:', error);
    }
  }, [setGlobalSkills]);

  const refreshProjects = useCallback(async (ideId?: string) => {
    try {
      const result = ideId
        ? await ideService.getProjects(ideId)
        : await projectService.list();
      if (result.success) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error('[useSidebarData] Failed to refresh projects:', error);
    }
  }, [setProjects]);

  const refreshAll = useCallback(async (ideId?: string) => {
    await Promise.all([
      refreshLibrary(),
      refreshGlobal(ideId),
      refreshProjects(ideId),
    ]);
  }, [refreshLibrary, refreshGlobal, refreshProjects]);

  return useMemo(() => ({
    refreshAll,
    refreshLibrary,
    refreshGlobal,
    refreshProjects,
  }), [refreshAll, refreshLibrary, refreshGlobal, refreshProjects]);
}
