import { invokeIPC } from './ipcService';

export interface DeployOptions {
  skillId: string;
  targetScope: 'global' | 'project';
  projectId?: string; // Note: This should be the project filesystem path, not the UUID
}

export const deployService = {
  toGlobal: (skillId: string) => invokeIPC<void>('deploy_to_global', { skillId }),
  // projectId must be the project's filesystem path (project.path), not project.id (UUID)
  toProject: (skillId: string, projectId: string) =>
    invokeIPC<void>('deploy_to_project', { skillId, projectId }),
  fromGlobal: (skillId: string, projectId: string) =>
    invokeIPC<void>('deploy_from_global', { skillId, projectId }),
};
