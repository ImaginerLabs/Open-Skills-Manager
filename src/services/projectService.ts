import { invokeIPC } from './ipcService';
import type { Project, ProjectSkill } from '../stores/projectStore';

export const projectService = {
  list: () => invokeIPC<Project[]>('project_list'),
  add: (path: string) => invokeIPC<Project>('project_add', { path }),
  remove: (id: string) => invokeIPC<void>('project_remove', { id }),
  skills: (projectId: string) => invokeIPC<ProjectSkill[]>('project_skills', { projectId }),
  refresh: (projectId?: string) => invokeIPC<void>('project_refresh', { projectId }),
};
