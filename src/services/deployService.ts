import { invokeIPC } from './ipcService';

export interface DeployOptions {
  skillId: string;
  targetScope: 'global' | 'project';
  projectId?: string; // Note: This should be the project filesystem path, not the UUID
}

export interface CrossIDEDeployOptions {
  skillId: string;
  targetIdeId: string;
  projectId?: string; // For project scope
}

export const deployService = {
  toGlobal: (skillId: string) => invokeIPC<void>('deploy_to_global', { skillId }),
  // projectId must be the project's filesystem path (project.path), not project.id (UUID)
  toProject: (skillId: string, projectId: string) =>
    invokeIPC<void>('deploy_to_project', { skillId, projectId }),
  fromGlobal: (skillId: string, projectId: string) =>
    invokeIPC<void>('deploy_from_global', { skillId, projectId }),
  // Deploy from project to global - skillPath is the full path to the skill folder
  fromProjectToGlobal: (skillPath: string) =>
    invokeIPC<void>('deploy_from_project_to_global', { skillPath }),

  // Cross-IDE deployment methods
  toGlobalForIDE: (skillId: string, targetIdeId: string) =>
    invokeIPC<void>('deploy_to_global_for_ide', { skillId, targetIdeId }),
  toProjectForIDE: (skillId: string, projectId: string, targetIdeId: string) =>
    invokeIPC<void>('deploy_to_project_for_ide', { skillId, projectId, targetIdeId }),
};
