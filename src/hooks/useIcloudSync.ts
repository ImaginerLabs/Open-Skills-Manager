import { useState, useCallback, useEffect, useRef } from 'react';
import { storageService, type SyncState, type SyncStatusInfo } from '../services/storageService';
import { icloudService } from '../services/icloudService';

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

const POLL_INTERVAL = 1000; // 1 second - fast polling for desktop app

export function useIcloudSync(): UseIcloudSyncResult {
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [syncStatusInfo, setSyncStatusInfo] = useState<SyncStatusInfo | null>(null);
  const [icloudAvailable, setIcloudAvailable] = useState(false);
  const [containerPath, setContainerPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [state, statusInfo, available, pathResult] = await Promise.all([
        storageService.getSyncState(),
        storageService.getSyncStatus(),
        storageService.isICloudAvailable(),
        icloudService.containerPath(),
      ]);

      setSyncState(state);
      setSyncStatusInfo(statusInfo);
      setIcloudAvailable(available);
      setContainerPath(pathResult.success ? pathResult.data : null);
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

  // Determine status from sync status info event
  const getStatus = (): 'synced' | 'syncing' | 'pending' | 'offline' | 'error' => {
    if (!icloudAvailable) return 'offline';
    if (error) return 'error';

    // Use the event from syncStatusInfo which is computed by backend
    if (syncStatusInfo?.event) {
      console.log('[useIcloudSync] event type:', syncStatusInfo.event.type);
      switch (syncStatusInfo.event.type) {
        case 'syncCompleted':
          return 'synced';
        case 'syncStarted':
          return 'pending';
        case 'syncFailed':
          return 'error';
        case 'offlineMode':
          return 'offline';
        case 'conflictDetected':
          return 'pending';
        default:
          break;
      }
    }

    // Fallback to checking syncState
    const pendingCount = syncState?.pendingChanges.filter(c => !c.synced).length ?? 0;
    if (pendingCount > 0) return 'pending';
    if (syncState?.lastSyncTime) return 'synced';

    return 'syncing';
  };

  // Get pending changes count from event or syncState
  const getPendingChanges = (): number => {
    if (syncStatusInfo?.event?.type === 'offlineMode') {
      return (syncStatusInfo.event as { type: 'offlineMode'; pendingChanges: number }).pendingChanges;
    }
    return syncState?.pendingChanges.filter(c => !c.synced).length ?? 0;
  };

  return {
    status: getStatus(),
    lastSyncTime: syncStatusInfo?.lastSyncTime ?? syncState?.lastSyncTime,
    pendingChanges: getPendingChanges(),
    storageUsed: syncStatusInfo?.storageUsed ?? 0,
    storageTotal: syncStatusInfo?.storageTotal ?? 5_000_000_000,
    containerPath,
    isLoading,
    error,
    forceSync,
    refresh,
  };
}
