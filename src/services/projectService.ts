import { invokeIPC } from './ipcService';
import type { Project, ProjectSkill } from '../stores/projectStore';
import type { LibrarySkill } from '../stores/libraryStore';

export interface PullOptions {
  categoryId?: string;
  groupId?: string;
  overwrite?: boolean;
}

export const projectService = {
  list: () => invokeIPC<Project[]>('project_list'),
  add: (path: string) => invokeIPC<Project>('project_add', { path }),
  remove: (id: string) => invokeIPC<void>('project_remove', { id }),
  skills: (projectId: string) => invokeIPC<ProjectSkill[]>('project_skills', { projectId }),
  getSkill: (projectId: string, skillId: string) =>
    invokeIPC<ProjectSkill>('project_skill_get', { projectId, skillId }),
  deleteSkill: (projectId: string, skillId: string) =>
    invokeIPC<void>('project_skill_delete', { projectId, skillId }),
  pullSkill: (projectId: string, skillId: string, options?: PullOptions) =>
    invokeIPC<LibrarySkill>('project_skill_pull', { projectId, skillId, options }),
  refresh: (projectId?: string) => invokeIPC<void>('project_refresh', { projectId }),
  refreshAll: () => invokeIPC<void>('project_refresh_all'),
};
