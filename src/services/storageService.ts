/**
 * StorageService - Unified storage layer for frontend
 * All config/library/sync operations go through this service
 */

import { invokeIPC, type IpcResult } from './ipcService';
import type { Group, Project } from '@/stores';

// ============================================================================
// Types
// ============================================================================

export interface Settings {
  theme: string;
  language: string;
  autoUpdateCheck: boolean;
  autoRefreshInterval: number;
  defaultImportCategory?: string;
}

export interface IDEConfig {
  id: string;
  name: string;
  globalScopePath: string;
  projectScopeName: string;
  projects: Project[];
  isEnabled: boolean;
  icon?: string;
}

export interface AppConfig {
  version: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  settings: Settings;
  syncEnabled: boolean;
  ideConfigs: IDEConfig[];
  activeIdeId: string;
}

export interface SkillEntry {
  id: string;
  folderName: string;
  groupId?: string | undefined;
  categoryId?: string | undefined;
  importedAt: string;
  updatedAt?: string | undefined;
}

export interface LibraryData {
  version: number;
  updatedAt: string;
  updatedBy: string;
  groups: Group[];
  skills: Record<string, SkillEntry>;
}

export interface PendingChange {
  changeId: string;
  changeType: 'create' | 'update' | 'delete';
  target: string;
  timestamp: string;
  synced: boolean;
}

export interface ConflictEntry {
  target: string;
  localVersion: number;
  remoteVersion: number;
  detectedAt: string;
  resolution: 'pending' | 'localWins' | 'remoteWins' | 'merged';
}

export interface SyncState {
  version: number;
  lastSyncTime?: string;
  lastSyncBy?: string;
  pendingChanges: PendingChange[];
  conflictLog: ConflictEntry[];
}

export type SyncEvent =
  | { type: 'syncStarted' }
  | { type: 'syncCompleted'; syncedItems: number }
  | { type: 'syncFailed'; error: string }
  | { type: 'conflictDetected'; target: string; localVersion: number; remoteVersion: number }
  | { type: 'offlineMode'; pendingChanges: number };

export interface SyncStatusInfo {
  event: SyncEvent;
  lastSyncTime?: string;
  lastError?: string;
  storageUsed: number;
  storageTotal: number;
}

export interface SkillOrgEntry {
  groupId?: string;
  categoryId?: string;
  importedAt: string;
}

// ============================================================================
// Helper to unwrap IpcResult
// ============================================================================

async function unwrap<T>(promise: Promise<IpcResult<T>>): Promise<T> {
  const result = await promise;
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error.message);
}

// ============================================================================
// Storage Service
// ============================================================================

export const storageService = {
  // ==========================================================================
  // Config Operations
  // ==========================================================================

  /**
   * Get application config
   */
  getConfig: () => unwrap(invokeIPC<AppConfig>('storage_config_get')),

  /**
   * Update settings
   */
  setSettings: (settings: Settings) =>
    unwrap(invokeIPC<AppConfig>('storage_config_set_settings', { settings })),

  /**
   * Enable or disable iCloud sync
   */
  setSyncEnabled: (enabled: boolean) =>
    unwrap(invokeIPC<AppConfig>('storage_config_set_sync_enabled', { enabled })),

  // ==========================================================================
  // IDE Operations
  // ==========================================================================

  /**
   * Get active IDE
   */
  getActiveIDE: () => unwrap(invokeIPC<IDEConfig>('storage_ide_get_active')),

  /**
   * Set active IDE
   */
  setActiveIDE: (ideId: string) =>
    unwrap(invokeIPC<AppConfig>('storage_ide_set_active', { ideId })),

  /**
   * List all IDEs
   */
  listIDEs: () => unwrap(invokeIPC<IDEConfig[]>('storage_ide_list')),

  /**
   * Update an IDE configuration
   */
  updateIDE: (ideId: string, ideConfig: IDEConfig) =>
    unwrap(invokeIPC<AppConfig>('storage_ide_update', { ideId, ideConfig })),

  // ==========================================================================
  // Library Operations
  // ==========================================================================

  /**
   * Get library data (groups + skills)
   */
  getLibrary: () => unwrap(invokeIPC<LibraryData>('storage_library_get')),

  /**
   * Get groups
   */
  getGroups: () => unwrap(invokeIPC<Group[]>('storage_groups_get')),

  /**
   * Set groups
   */
  setGroups: (groups: Group[]) =>
    unwrap(invokeIPC<LibraryData>('storage_groups_set', { groups })),

  /**
   * Get all skill entries
   */
  getSkills: () => unwrap(invokeIPC<Record<string, SkillEntry>>('storage_skills_get')),

  /**
   * Add a skill entry
   */
  addSkill: (entry: SkillEntry) =>
    unwrap(invokeIPC<void>('storage_skill_add', { entry })),

  /**
   * Remove a skill entry
   */
  removeSkill: (folderName: string) =>
    unwrap(invokeIPC<void>('storage_skill_remove', { folderName })),

  // ==========================================================================
  // Sync Operations
  // ==========================================================================

  /**
   * Get sync state
   */
  getSyncState: () => unwrap(invokeIPC<SyncState>('storage_sync_state')),

  /**
   * Force immediate sync
   */
  forceSync: () => unwrap(invokeIPC<void>('storage_sync_force')),

  /**
   * Get sync status info
   */
  getSyncStatus: () => unwrap(invokeIPC<SyncStatusInfo>('storage_sync_status')),

  // ==========================================================================
  // Migration Operations
  // ==========================================================================

  /**
   * Check if migration is needed
   */
  needsMigration: () => unwrap(invokeIPC<boolean>('storage_needs_migration')),

  /**
   * Execute migration
   */
  migrate: () => unwrap(invokeIPC<void>('storage_migrate')),

  /**
   * Rollback migration
   */
  rollbackMigration: () => unwrap(invokeIPC<void>('storage_migrate_rollback')),

  // ==========================================================================
  // Utility Operations
  // ==========================================================================

  /**
   * Get client ID
   */
  getClientId: () => unwrap(invokeIPC<string>('storage_client_id')),

  /**
   * Check if iCloud is available
   */
  isICloudAvailable: () => unwrap(invokeIPC<boolean>('storage_icloud_available')),

  /**
   * Ensure iCloud directory structure exists
   */
  ensureICloudPath: () => unwrap(invokeIPC<string>('storage_ensure_icloud_path')),

  /**
   * Invalidate cache
   */
  invalidateCache: () => unwrap(invokeIPC<void>('storage_invalidate_cache')),
};

// ============================================================================
// Legacy Compatibility Layer
// ============================================================================

/**
 * Provides backward compatibility with the old configService interface
 * Maps old calls to new storage service
 */
export const configServiceCompat = {
  get: async () => {
    const [config, library] = await Promise.all([
      storageService.getConfig(),
      storageService.getLibrary(),
    ]);

    // Map to old format
    return {
      version: config.version,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      updatedBy: config.updatedBy || undefined,
      settings: config.settings,
      groups: library.groups,
      ideConfigs: config.ideConfigs,
      activeIdeId: config.activeIdeId,
      sync: {
        enabled: config.syncEnabled,
        intervalMinutes: 5,
        lastSyncTime: undefined,
      },
      skillOrganization: Object.fromEntries(
        Object.entries(library.skills).map(([folder, entry]) => [
          folder,
          {
            groupId: entry.groupId,
            categoryId: entry.categoryId,
            importedAt: entry.importedAt,
          },
        ])
      ),
    };
  },

  setSettings: storageService.setSettings,

  getActiveIDE: storageService.getActiveIDE,
  setActiveIDE: storageService.setActiveIDE,
  addIDE: async (_ideConfig: IDEConfig) => {
    throw new Error('addIDE not supported in new storage layer');
  },
  removeIDE: async (_ideId: string) => {
    throw new Error('removeIDE not supported in new storage layer');
  },
  updateIDE: storageService.updateIDE,

  getProjects: async (ideId?: string) => {
    const config = await storageService.getConfig();
    const activeId = ideId || config.activeIdeId;
    const ide = config.ideConfigs.find((i: IDEConfig) => i.id === activeId);
    return ide?.projects || [];
  },

  getGroups: storageService.getGroups,
  setGroups: async (groups: Group[]) => {
    await storageService.setGroups(groups);
    return storageService.getConfig();
  },

  getSkillOrg: async () => {
    const library = await storageService.getLibrary();
    return Object.fromEntries(
      Object.entries(library.skills).map(([folder, entry]) => [
        folder,
        {
          groupId: entry.groupId,
          categoryId: entry.categoryId,
          importedAt: entry.importedAt,
        },
      ])
    );
  },

  setSkillOrg: async (folderName: string, entry: SkillOrgEntry) => {
    const library = await storageService.getLibrary();
    const existing = library.skills[folderName];
    await storageService.addSkill({
      id: existing?.id || `skill-${Date.now()}`,
      folderName,
      groupId: entry.groupId ?? undefined,
      categoryId: entry.categoryId ?? undefined,
      importedAt: entry.importedAt,
    });
    return storageService.getConfig();
  },

  setSyncSettings: async (sync: { enabled: boolean; intervalMinutes: number; lastSyncTime?: string }) => {
    return storageService.setSyncEnabled(sync.enabled);
  },

  needsMigration: storageService.needsMigration,
};

/**
 * Provides backward compatibility with the old syncService interface
 */
export const syncServiceCompat = {
  status: async () => {
    const [syncState, icloudAvailable] = await Promise.all([
      storageService.getSyncState(),
      storageService.isICloudAvailable(),
    ]);

    return {
      status: icloudAvailable
        ? (syncState.pendingChanges.some(c => !c.synced) ? 'pending' : 'synced')
        : 'offline',
      lastSyncTime: syncState.lastSyncTime,
      pendingChanges: syncState.pendingChanges.filter(c => !c.synced).length,
      errorMessage: undefined,
      storageUsed: 0,
      storageTotal: 0,
      icloudAvailable,
    };
  },

  full: storageService.forceSync,
  enable: storageService.setSyncEnabled,
  getICloudPath: async () => '',
  getLocalPath: async () => '',
};
