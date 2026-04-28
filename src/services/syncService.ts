import { invokeIPC } from './ipcService';

export interface SyncStatusInfo {
  status: 'synced' | 'syncing' | 'pending' | 'offline' | 'error';
  lastSyncTime?: string;
  pendingChanges: number;
  errorMessage?: string;
  storageUsed: number;
  storageTotal: number;
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  errors: string[];
  timestamp: string;
}

export const syncService = {
  /**
   * Get current sync status
   */
  status: () => invokeIPC<SyncStatusInfo>('sync_status'),

  /**
   * Perform a full sync to iCloud
   */
  full: () => invokeIPC<SyncResult>('sync_full'),

  /**
   * Enable or disable automatic sync
   */
  enable: (enabled: boolean) => invokeIPC<void>('sync_enable', { enabled }),

  /**
   * Set the sync interval in minutes
   */
  setInterval: (intervalMinutes: number) =>
    invokeIPC<void>('sync_set_interval', { intervalMinutes }),

  /**
   * Get the iCloud path
   */
  getICloudPath: () => invokeIPC<string>('sync_icloud_path'),
};
