import { invokeIPC } from './ipcService';

export interface DeployOptions {
  skillId: string;
  targetScope: 'global' | 'project';
  projectId?: string;
}

export const deployService = {
  toGlobal: (skillId: string) => invokeIPC<void>('deploy_to_global', { skillId }),
  toProject: (skillId: string, projectId: string) =>
    invokeIPC<void>('deploy_to_project', { skillId, projectId }),
  fromGlobal: (skillId: string, projectId: string) =>
    invokeIPC<void>('deploy_from_global', { skillId, projectId }),
};
