import { invokeIPC } from './ipcService';
import type { Group, Project } from '@/stores';

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

export interface SyncSettings {
  enabled: boolean;
  intervalMinutes: number;
  lastSyncTime?: string;
}

export interface SkillOrgEntry {
  groupId?: string;
  categoryId?: string;
  importedAt: string;
}

export interface OpenSkillsManagerConfig {
  version: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;  // client_id of last modifier
  settings: Settings;
  groups: Group[];
  ideConfigs: IDEConfig[];
  activeIdeId: string;
  sync: SyncSettings;
  skillOrganization: Record<string, SkillOrgEntry>;
}

export const configService = {
  /**
   * Get the full application config
   */
  get: () => invokeIPC<OpenSkillsManagerConfig>('config_get'),

  /**
   * Set the full application config
   */
  set: (config: OpenSkillsManagerConfig) =>
    invokeIPC<void>('config_set', { config }),

  /**
   * Update settings only
   */
  setSettings: (settings: Settings) =>
    invokeIPC<OpenSkillsManagerConfig>('config_set_settings', { settings }),

  /**
   * Get the active IDE
   */
  getActiveIDE: () => invokeIPC<IDEConfig>('config_get_active_ide'),

  /**
   * Set the active IDE
   */
  setActiveIDE: (ideId: string) =>
    invokeIPC<OpenSkillsManagerConfig>('config_set_active_ide', { ideId }),

  /**
   * Add a new IDE configuration
   */
  addIDE: (ideConfig: IDEConfig) =>
    invokeIPC<OpenSkillsManagerConfig>('config_add_ide', { ideConfig }),

  /**
   * Remove an IDE configuration
   */
  removeIDE: (ideId: string) =>
    invokeIPC<OpenSkillsManagerConfig>('config_remove_ide', { ideId }),

  /**
   * Update an IDE configuration
   */
  updateIDE: (ideId: string, ideConfig: IDEConfig) =>
    invokeIPC<OpenSkillsManagerConfig>('config_update_ide', { ideId, ideConfig }),

  /**
   * Get projects for an IDE
   */
  getProjects: (ideId?: string) =>
    invokeIPC<Project[]>('config_get_projects', { ideId }),

  /**
   * Add a project to an IDE
   */
  addProject: (ideId: string | undefined, project: Project) =>
    invokeIPC<OpenSkillsManagerConfig>('config_add_project', { ideId, project }),

  /**
   * Remove a project from an IDE
   */
  removeProject: (ideId: string | undefined, projectId: string) =>
    invokeIPC<OpenSkillsManagerConfig>('config_remove_project', { ideId, projectId }),

  /**
   * Update a project in an IDE
   */
  updateProject: (ideId: string | undefined, project: Project) =>
    invokeIPC<OpenSkillsManagerConfig>('config_update_project', { ideId, project }),

  /**
   * Get groups
   */
  getGroups: () => invokeIPC<Group[]>('config_get_groups'),

  /**
   * Set groups
   */
  setGroups: (groups: Group[]) =>
    invokeIPC<OpenSkillsManagerConfig>('config_set_groups', { groups }),

  /**
   * Get skill organization
   */
  getSkillOrg: () =>
    invokeIPC<Record<string, SkillOrgEntry>>('config_get_skill_org'),

  /**
   * Set skill organization entry
   */
  setSkillOrg: (folderName: string, entry: SkillOrgEntry) =>
    invokeIPC<OpenSkillsManagerConfig>('config_set_skill_org', { folderName, entry }),

  /**
   * Remove skill organization entry
   */
  removeSkillOrg: (folderName: string) =>
    invokeIPC<OpenSkillsManagerConfig>('config_remove_skill_org', { folderName }),

  /**
   * Set sync settings
   */
  setSyncSettings: (sync: SyncSettings) =>
    invokeIPC<OpenSkillsManagerConfig>('config_set_sync_settings', { sync }),

  /**
   * Check if migration is needed
   */
  needsMigration: () => invokeIPC<boolean>('config_needs_migration'),
};
