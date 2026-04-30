/**
 * ConfigService - Application configuration service
 * Re-exports from the unified storageService for backward compatibility
 */

import {
  storageService,
  configServiceCompat,
  type SkillOrgEntry,
} from './storageService';
import type { Settings, IDEConfig } from '@/types/ide';
import { invokeIPC } from './ipcService';

// Re-export types
export type { Settings, IDEConfig, SkillOrgEntry };

// Use compatibility layer for backward compatibility
export const configService = {
  /**
   * Get the full application config
   */
  get: configServiceCompat.get,

  /**
   * Set the full application config (not recommended, use specific setters)
   */
  set: async (_config: unknown) => {
    console.warn('configService.set is deprecated, use specific setters');
  },

  /**
   * Update settings only
   */
  setSettings: storageService.setSettings,

  /**
   * Get the active IDE
   */
  getActiveIDE: storageService.getActiveIDE,

  /**
   * Set the active IDE
   */
  setActiveIDE: storageService.setActiveIDE,

  /**
   * Add a new IDE configuration
   */
  addIDE: configServiceCompat.addIDE,

  /**
   * Remove an IDE configuration
   */
  removeIDE: configServiceCompat.removeIDE,

  /**
   * Update an IDE configuration
   */
  updateIDE: storageService.updateIDE,

  /**
   * Get projects for an IDE
   */
  getProjects: configServiceCompat.getProjects,

  /**
   * Add a project to an IDE
   */
  addProject: async (_ideId: string | undefined, _project: unknown) => {
    throw new Error('Use storageService.updateIDE to modify projects');
  },

  /**
   * Remove a project from an IDE
   */
  removeProject: async (_ideId: string | undefined, _projectId: string) => {
    throw new Error('Use storageService.updateIDE to modify projects');
  },

  /**
   * Update a project in an IDE
   */
  updateProject: async (_ideId: string | undefined, _project: unknown) => {
    throw new Error('Use storageService.updateIDE to modify projects');
  },

  /**
   * Get groups
   */
  getGroups: storageService.getGroups,

  /**
   * Set groups
   */
  setGroups: configServiceCompat.setGroups,

  /**
   * Get skill organization
   */
  getSkillOrg: configServiceCompat.getSkillOrg,

  /**
   * Set skill organization entry
   */
  setSkillOrg: configServiceCompat.setSkillOrg,

  /**
   * Remove skill organization entry
   */
  removeSkillOrg: async (folderName: string) => {
    await storageService.removeSkill(folderName);
    return storageService.getConfig();
  },

  /**
   * Set sync settings
   */
  setSyncSettings: configServiceCompat.setSyncSettings,

  /**
   * Check if migration is needed
   */
  needsMigration: storageService.needsMigration,

  /**
   * Get the application data directory path
   * ~/Library/Application Support/OpenSkillsManager/
   */
  getAppDataPath: async (): Promise<string> => {
    const result = await invokeIPC<string>('config_app_data_path');
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  },

  /**
   * Reveal a path in Finder (macOS) or default file manager
   */
  revealPath: async (path: string): Promise<void> => {
    const result = await invokeIPC<void>('config_reveal_path', { path });
    if (!result.success) {
      throw new Error(result.error.message);
    }
  },

  /**
   * Open a path directly in Finder (macOS) or default file manager
   */
  openPath: async (path: string): Promise<void> => {
    const result = await invokeIPC<void>('config_open_path', { path });
    if (!result.success) {
      throw new Error(result.error.message);
    }
  },
};

// Export the new storage service for direct access
export { storageService } from './storageService';
