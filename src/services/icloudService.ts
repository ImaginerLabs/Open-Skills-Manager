import { invokeIPC } from './ipcService';

export type SyncStatusType = 'synced' | 'syncing' | 'pending' | 'offline' | 'error';

export interface SyncStatusInfo {
  status: SyncStatusType;
  lastSyncTime?: string;
  pendingChanges: number;
  errorMessage?: string;
  storageUsed: number;
  storageTotal: number;
}

export interface QuotaInfo {
  available: boolean;
  usedBytes: number;
  totalBytes: number;
  percentUsed: number;
}

export interface PendingChange {
  skillId: string;
  changeType: string;
  timestamp: string;
}

export interface ConflictVersion {
  modifiedTime: string;
  size: number;
  deviceName: string;
}

export interface ConflictInfo {
  skillId: string;
  skillName: string;
  localVersion: ConflictVersion;
  remoteVersion: ConflictVersion;
}

export type ConflictResolution = 'local' | 'remote' | 'both';

export const icloudService = {
  syncStatus: () => invokeIPC<SyncStatusInfo>('icloud_sync_status'),

  containerPath: () => invokeIPC<string>('icloud_container_path'),

  quotaCheck: () => invokeIPC<QuotaInfo>('icloud_quota_check'),

  getPendingChanges: () => invokeIPC<PendingChange[]>('icloud_get_pending_changes'),

  getConflicts: () => invokeIPC<ConflictInfo[]>('icloud_get_conflicts'),

  resolveConflict: (skillId: string, resolution: ConflictResolution) =>
    invokeIPC<void>('icloud_resolve_conflict', { skillId, resolution }),

  initialize: () => invokeIPC<string>('icloud_initialize'),

  localCachePath: () => invokeIPC<string>('icloud_local_cache_path'),
};
