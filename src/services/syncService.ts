/**
 * SyncService - iCloud synchronization service
 * Re-exports from the unified storageService for backward compatibility
 */

import {
  storageService,
  syncServiceCompat,
  type SyncState,
  type SyncEvent,
} from './storageService';

// Re-export types
export type { SyncState, SyncEvent };

// Legacy types for backward compatibility
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

// Use compatibility layer for backward compatibility
export const syncService = {
  /**
   * Get current sync status
   */
  status: syncServiceCompat.status,

  /**
   * Perform a full sync between local and iCloud
   */
  full: async (): Promise<SyncResult> => {
    await storageService.forceSync();
    const state = await storageService.getSyncState();
    return {
      success: true,
      syncedItems: 0,
      errors: [],
      timestamp: state.lastSyncTime || new Date().toISOString(),
    };
  },

  /**
   * Enable or disable automatic sync
   */
  enable: storageService.setSyncEnabled,

  /**
   * Get the iCloud path
   */
  getICloudPath: syncServiceCompat.getICloudPath,

  /**
   * Get the local storage path
   */
  getLocalPath: syncServiceCompat.getLocalPath,

  // New methods from storageService
  getSyncState: storageService.getSyncState,
  forceSync: storageService.forceSync,
  getSyncStatus: storageService.getSyncStatus,
  getClientId: storageService.getClientId,
  isICloudAvailable: storageService.isICloudAvailable,
};

// Export the new storage service for direct access
export { storageService } from './storageService';