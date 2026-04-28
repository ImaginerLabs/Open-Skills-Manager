import { useState, useCallback, useEffect, useRef } from 'react';
import { storageService, type SyncState, type SyncStatusInfo } from '../services/storageService';

export interface UseIcloudSyncResult {
  status: 'synced' | 'syncing' | 'pending' | 'offline' | 'error';
  lastSyncTime: string | undefined;
  pendingChanges: number;
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
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [syncStatusInfo, setSyncStatusInfo] = useState<SyncStatusInfo | null>(null);
  const [icloudAvailable, setIcloudAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [state, statusInfo, available] = await Promise.all([
        storageService.getSyncState(),
        storageService.getSyncStatus(),
        storageService.isICloudAvailable(),
      ]);

      setSyncState(state);
      setSyncStatusInfo(statusInfo);
      setIcloudAvailable(available);
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
      await storageService.forceSync();
      // Refresh state after sync
      const [state, statusInfo] = await Promise.all([
        storageService.getSyncState(),
        storageService.getSyncStatus(),
      ]);
      setSyncState(state);
      setSyncStatusInfo(statusInfo);
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

  // Determine status from sync state
  const getStatus = (): 'synced' | 'syncing' | 'pending' | 'offline' | 'error' => {
    if (!icloudAvailable) return 'offline';
    if (error) return 'error';

    const pendingCount = syncState?.pendingChanges.filter(c => !c.synced).length ?? 0;
    if (pendingCount > 0) return 'pending';
    if (syncState?.lastSyncTime) return 'synced';

    return 'syncing';
  };

  return {
    status: getStatus(),
    lastSyncTime: syncState?.lastSyncTime,
    pendingChanges: syncState?.pendingChanges.filter(c => !c.synced).length ?? 0,
    storageUsed: syncStatusInfo?.storageUsed ?? 0,
    storageTotal: syncStatusInfo?.storageTotal ?? 5_000_000_000,
    containerPath: null, // Not available in new storage
    isLoading,
    error,
    forceSync,
    refresh,
  };
}
