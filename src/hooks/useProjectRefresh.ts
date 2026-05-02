import { useEffect, useRef, useCallback } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { projectService } from '../services/projectService';
import { useUIStore } from '../stores/uiStore';

export interface UseProjectRefreshResult {
  isRefreshing: boolean;
  refreshingProjectId: string | null;
  lastRefreshAt: Date | null;
  refreshError: string | null;
  refresh: (projectId?: string) => Promise<boolean>;
  refreshAll: () => Promise<boolean>;
}

const DEFAULT_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useProjectRefresh(
  projectId?: string,
  options?: { autoRefresh?: boolean; intervalMs?: number }
): UseProjectRefreshResult {
  const { autoRefresh = true, intervalMs = DEFAULT_REFRESH_INTERVAL_MS } = options ?? {};

  const {
    isRefreshing,
    refreshingProjectId,
    lastRefreshAt,
    refreshError,
    setRefreshing,
    setRefreshError,
    setProjectSkills,
    updateProjectSkillCount,
  } = useProjectStore();

  const { showToast } = useUIStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  const refresh = useCallback(
    async (targetProjectId?: string): Promise<boolean> => {
      const id = targetProjectId ?? projectId;
      if (!id) {
        return false;
      }

      setRefreshing(true, id);
      setRefreshError(null);

      try {
        const result = await projectService.skills(id);
        if (!isMountedRef.current) {
          return false;
        }

        if (result.success && result.data) {
          setProjectSkills(id, result.data);
          updateProjectSkillCount(id, result.data.length);
          return true;
        } else {
          const message = result.success ? 'Unknown error' : result.error.message;
          setRefreshError(message);
          showToast('error', `Failed to refresh project: ${message}`);
          return false;
        }
      } catch (e) {
        if (!isMountedRef.current) {
          return false;
        }
        const message = e instanceof Error ? e.message : 'Unknown error';
        setRefreshError(message);
        showToast('error', `Failed to refresh project: ${message}`);
        return false;
      } finally {
        if (isMountedRef.current) {
          setRefreshing(false);
        }
      }
    },
    [projectId, setRefreshing, setRefreshError, setProjectSkills, updateProjectSkillCount, showToast]
  );

  const refreshAll = useCallback(async (): Promise<boolean> => {
    setRefreshing(true);
    setRefreshError(null);

    try {
      const result = await projectService.refreshAll();
      if (!isMountedRef.current) {
        return false;
      }

      if (result.success) {
        showToast('success', 'All projects refreshed');
        return true;
      } else {
        const message = result.success ? 'Unknown error' : result.error.message;
        setRefreshError(message);
        showToast('error', `Failed to refresh projects: ${message}`);
        return false;
      }
    } catch (e) {
      if (!isMountedRef.current) {
        return false;
      }
      const message = e instanceof Error ? e.message : 'Unknown error';
      setRefreshError(message);
      showToast('error', `Failed to refresh projects: ${message}`);
      return false;
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [setRefreshing, setRefreshError, showToast]);

  // Initial refresh on mount
  useEffect(() => {
    isMountedRef.current = true;

    if (autoRefresh && projectId) {
      refresh(projectId);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [projectId, autoRefresh, refresh]);

  // Periodic refresh
  useEffect(() => {
    if (!autoRefresh || !projectId || intervalMs <= 0) {
      return;
    }

    intervalRef.current = setInterval(() => {
      refresh(projectId);
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [projectId, autoRefresh, intervalMs, refresh]);

  const lastRefresh = projectId && lastRefreshAt instanceof Map ? lastRefreshAt.get(projectId) ?? null : null;

  return {
    isRefreshing,
    refreshingProjectId,
    lastRefreshAt: lastRefresh,
    refreshError,
    refresh,
    refreshAll,
  };
}
