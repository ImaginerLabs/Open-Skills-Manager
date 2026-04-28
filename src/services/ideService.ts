import { invokeIPC } from './ipcService';
import type { Project } from '@/stores';
import type { IDEConfig, AppConfig } from './storageService';

export const ideService = {
  /**
   * Get list of all IDE configurations
   */
  list: () => invokeIPC<IDEConfig[]>('storage_ide_list'),

  /**
   * Get the currently active IDE configuration
   */
  getActive: () => invokeIPC<IDEConfig>('storage_ide_get_active'),

  /**
   * Set the active IDE
   */
  setActive: (ideId: string) => invokeIPC<AppConfig>('storage_ide_set_active', { ideId }),

  /**
   * Get global skills for a specific IDE
   */
  getGlobalSkills: (ideId?: string) =>
    invokeIPC<import('@/stores').GlobalSkill[]>('ide_global_list', { ideId }),

  /**
   * Get projects for a specific IDE
   */
  getProjects: (ideId?: string) =>
    invokeIPC<Project[]>('ide_project_list', { ideId }),

  /**
   * Add a project to a specific IDE
   */
  addProject: (ideId: string | undefined, projectPath: string) =>
    invokeIPC<Project>('ide_project_add', { ideId, projectPath }),

  /**
   * Remove a project from a specific IDE
   */
  removeProject: (ideId: string | undefined, projectId: string) =>
    invokeIPC<void>('ide_project_remove', { ideId, projectId }),

  /**
   * Refresh a project's data
   */
  refreshProject: (ideId: string | undefined, projectId: string) =>
    invokeIPC<Project>('ide_project_refresh', { ideId, projectId }),

  /**
   * Get skills for a specific project in an IDE
   */
  getProjectSkills: (ideId: string | undefined, projectId: string) =>
    invokeIPC<import('@/stores').GlobalSkill[]>('ide_project_skills', { ideId, projectId }),

  /**
   * Get the global scope path for a specific IDE
   */
  getGlobalPath: (ideId?: string) =>
    invokeIPC<string>('ide_get_global_path', { ideId }),
};
