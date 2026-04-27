import { useState, useCallback, useEffect, useRef } from 'react';
import { icloudService, type ConflictInfo, type ConflictResolution } from '../services/icloudService';

export interface OfflineChange {
  id: string;
  skillId: string;
  changeType: 'create' | 'update' | 'delete';
  timestamp: Date;
  data?: unknown;
}

export interface UseOfflineSyncResult {
  isOnline: boolean;
  pendingChanges: OfflineChange[];
  pendingCount: number;
  conflicts: ConflictInfo[];
  hasConflicts: boolean;
  queueChange: (skillId: string, changeType: OfflineChange['changeType'], data?: unknown) => void;
  resolveConflict: (skillId: string, resolution: ConflictResolution) => Promise<boolean>;
  syncPending: () => Promise<void>;
  clearQueue: () => void;
}

const SYNC_INTERVAL = 60000;

export function useOfflineSync(): UseOfflineSyncResult {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<OfflineChange[]>([]);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncPending = useCallback(async () => {
    const statusResult = await icloudService.syncStatus();
    if (!statusResult.success || statusResult.data.status === 'offline') {
      return;
    }

    setPendingChanges((prev) => {
      if (prev.length === 0) return prev;
      clearLocalStorage();
      return [];
    });
  }, []);

  const checkOnlineStatus = useCallback(async () => {
    const statusResult = await icloudService.syncStatus();
    if (statusResult.success) {
      const newOnline = statusResult.data.status !== 'offline';
      setIsOnline(newOnline);
    }
  }, []);

  const checkConflicts = useCallback(async () => {
    const result = await icloudService.getConflicts();
    if (result.success) {
      setConflicts(result.data);
    }
  }, []);

  const queueChange = useCallback(
    (skillId: string, changeType: OfflineChange['changeType'], data?: unknown) => {
      const change: OfflineChange = {
        id: crypto.randomUUID(),
        skillId,
        changeType,
        timestamp: new Date(),
        data,
      };

      setPendingChanges((prev) => [...prev, change]);

      if (!isOnline) {
        saveToLocalStorage(change);
      }
    },
    [isOnline]
  );

  const resolveConflict = useCallback(
    async (skillId: string, resolution: ConflictResolution): Promise<boolean> => {
      const result = await icloudService.resolveConflict(skillId, resolution);
      if (result.success) {
        setConflicts((prev) => prev.filter((c) => c.skillId !== skillId));
        return true;
      }
      return false;
    },
    []
  );

  const clearQueue = useCallback(() => {
    setPendingChanges([]);
    clearLocalStorage();
  }, []);

  useEffect(() => {
    const stored = loadFromLocalStorage();
    if (stored.length > 0) {
      setPendingChanges(stored);
    }

    checkOnlineStatus();
    checkConflicts();

    syncIntervalRef.current = setInterval(() => {
      checkOnlineStatus();
      checkConflicts();
    }, SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [checkOnlineStatus, checkConflicts]);

  useEffect(() => {
    if (isOnline && pendingChanges.length > 0) {
      syncPending();
    }
  }, [isOnline, pendingChanges.length, syncPending]);

  return {
    isOnline,
    pendingChanges,
    pendingCount: pendingChanges.length,
    conflicts,
    hasConflicts: conflicts.length > 0,
    queueChange,
    resolveConflict,
    syncPending,
    clearQueue,
  };
}

const STORAGE_KEY = 'csm_offline_changes';

function saveToLocalStorage(change: OfflineChange): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const changes: OfflineChange[] = stored ? JSON.parse(stored) : [];
    changes.push(change);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(changes));
  } catch {
    // Ignore storage errors
  }
}

function loadFromLocalStorage(): OfflineChange[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
