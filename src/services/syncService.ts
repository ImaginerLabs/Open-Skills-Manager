import { invokeIPC } from './ipcService';

export interface SyncStatusInfo {
  status: 'synced' | 'syncing' | 'pending' | 'offline' | 'error';
  lastSyncTime?: string;
  pendingChanges: number;
  errorMessage?: string;
  storageUsed: number;
  storageTotal: number;
  icloudAvailable: boolean;
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
   * Perform a full sync between local and iCloud
   */
  full: () => invokeIPC<SyncResult>('sync_full'),

  /**
   * Enable or disable automatic sync
   */
  enable: (enabled: boolean) => invokeIPC<void>('sync_enable', { enabled }),

  /**
   * Get the iCloud path
   */
  getICloudPath: () => invokeIPC<string>('sync_icloud_path'),

  /**
   * Get the local storage path
   */
  getLocalPath: () => invokeIPC<string>('sync_local_path'),
};
