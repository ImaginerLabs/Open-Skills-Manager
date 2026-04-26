import { invokeIPC } from './ipcService';

export interface SyncStatus {
  isAvailable: boolean;
  isSyncing: boolean;
  lastSyncTime?: Date;
  error?: string;
}

export interface ConflictInfo {
  skillId: string;
  localVersion: string;
  remoteVersion: string;
  conflictType: 'content' | 'metadata';
}

export const icloudService = {
  syncStatus: () => invokeIPC<SyncStatus>('icloud_sync_status'),
  resolveConflict: (skillId: string, resolution: 'local' | 'remote' | 'merge') =>
    invokeIPC<void>('icloud_resolve_conflict', { skillId, resolution }),
};
