import { useState, useCallback, useEffect, useRef } from 'react';
import { icloudService, type SyncStatusInfo, type PendingChange } from '../services/icloudService';

export interface UseIcloudSyncResult {
  status: SyncStatusInfo['status'];
  lastSyncTime: string | undefined;
  pendingChanges: number;
  pendingChangeList: PendingChange[];
  storageUsed: number;
  storageTotal: number;
  containerPath: string | null;
  isLoading: boolean;
  error: string | null;
  forceSync: () => Promise<void>;
  refresh: () => Promise<void>;
}

const POLL_INTERVAL = 30000; // 30 seconds

export function useIcloudSync(): UseIcloudSyncResult {
  const [statusInfo, setStatusInfo] = useState<SyncStatusInfo | null>(null);
  const [pendingChangeList, setPendingChangeList] = useState<PendingChange[]>([]);
  const [containerPath, setContainerPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statusResult, pendingResult, pathResult] = await Promise.all([
        icloudService.syncStatus(),
        icloudService.getPendingChanges(),
        icloudService.containerPath(),
      ]);

      if (statusResult.success) {
        setStatusInfo(statusResult.data);
      } else {
        setError(statusResult.error.message);
      }

      if (pendingResult.success) {
        setPendingChangeList(pendingResult.data);
      }

      if (pathResult.success) {
        setContainerPath(pathResult.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forceSync = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const statusResult = await icloudService.syncStatus();
      if (statusResult.success) {
        setStatusInfo(statusResult.data);
      } else {
        setError(statusResult.error.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    pollRef.current = setInterval(refresh, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [refresh]);

  return {
    status: statusInfo?.status ?? 'offline',
    lastSyncTime: statusInfo?.lastSyncTime,
    pendingChanges: statusInfo?.pendingChanges ?? 0,
    pendingChangeList,
    storageUsed: statusInfo?.storageUsed ?? 0,
    storageTotal: statusInfo?.storageTotal ?? 0,
    containerPath,
    isLoading,
    error,
    forceSync,
    refresh,
  };
}
