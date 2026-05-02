import { useState, useCallback, useRef } from 'react';
import { invokeIPC } from '@/services/ipcService';
import type { LibrarySkill, Deployment } from '@/stores/libraryStore';
import { useIDEStore } from '@/stores/ideStore';

export interface BatchDeployResult {
  success: Deployment[];
  failed: Array<{ skillId: string; skillName: string; error: string }>;
  cancelled: Array<{ skillId: string; skillName: string }>;
}

export interface BatchDeployOptions {
  targetScope: 'global' | 'project';
  targetIdeId?: string;  // Target IDE, defaults to current IDE
  projectId?: string;    // Required for project scope
  sourceScope?: 'library' | 'global' | 'project';  // Source scope, defaults to 'library'
}

export interface UseBatchDeployResult {
  status: 'idle' | 'deploying' | 'completed' | 'cancelled';
  progress: number;
  total: number;
  currentSkillName: string;
  result: BatchDeployResult | null;
  startDeploy: (skills: LibrarySkill[], options: BatchDeployOptions) => void;
  cancel: () => void;
  reset: () => void;
  retryFailed: () => void;
}

export function useBatchDeploy(): UseBatchDeployResult {
  const { activeIdeId } = useIDEStore();
  const [status, setStatus] = useState<'idle' | 'deploying' | 'completed' | 'cancelled'>('idle');
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentSkillName, setCurrentSkillName] = useState('');
  const [result, setResult] = useState<BatchDeployResult | null>(null);

  const cancelledRef = useRef(false);
  const pendingSkillsRef = useRef<LibrarySkill[]>([]);
  const optionsRef = useRef<BatchDeployOptions>({ targetScope: 'global' });

  const deploySkill = useCallback(async (skill: LibrarySkill): Promise<{ success: boolean; error?: string }> => {
    const { targetScope, targetIdeId, projectId, sourceScope } = optionsRef.current;
    const effectiveIdeId = targetIdeId ?? activeIdeId;
    const isCrossIDE = targetIdeId !== undefined && targetIdeId !== activeIdeId;
    const effectiveSourceScope = sourceScope ?? 'library';

    let channel: string;
    let args: Record<string, unknown>;

    // Handle deployment based on source scope
    if (effectiveSourceScope === 'global') {
      // Deploy from global to project
      if (targetScope === 'project' && projectId) {
        channel = 'deploy_from_global';
        args = { skillId: skill.folderName, projectId };
      } else {
        console.error('Global source only supports project target');
        return { success: false, error: 'Global source only supports project target' };
      }
    } else if (effectiveSourceScope === 'project') {
      // Deploy from project to global
      if (targetScope === 'global') {
        channel = 'deploy_from_project_to_global';
        args = { skillPath: skill.path };
      } else {
        console.error('Project source only supports global target');
        return { success: false, error: 'Project source only supports global target' };
      }
    } else {
      // Deploy from library
      if (targetScope === 'global') {
        if (isCrossIDE) {
          channel = 'deploy_to_global_for_ide';
          args = { skillId: skill.id, targetIdeId: effectiveIdeId };
        } else {
          channel = 'deploy_to_global';
          args = { skillId: skill.id };
        }
      } else {
        // Project scope
        if (!projectId) {
          console.error('Project ID is required for project scope deployment');
          return { success: false, error: 'Project ID is required for project scope deployment' };
        }
        if (isCrossIDE) {
          channel = 'deploy_to_project_for_ide';
          args = { skillId: skill.id, projectId, targetIdeId: effectiveIdeId };
        } else {
          channel = 'deploy_to_project';
          args = { skillId: skill.id, projectId };
        }
      }
    }

    const response = await invokeIPC<void>(channel, args);
    if (response.success) {
      return { success: true };
    }
    return { success: false, error: response.error?.message ?? 'Deployment failed' };
  }, [activeIdeId]);

  const processQueue = useCallback(async () => {
    const initialResult: BatchDeployResult = {
      success: [],
      failed: [],
      cancelled: [],
    };

    const pendingSkills = pendingSkillsRef.current;

    for (let i = 0; i < pendingSkills.length; i++) {
      if (cancelledRef.current) {
        // Add remaining skills to cancelled
        for (let j = i; j < pendingSkills.length; j++) {
          const s = pendingSkills[j];
          if (s) {
            initialResult.cancelled.push({
              skillId: s.id,
              skillName: s.name,
            });
          }
        }
        break;
      }

      const skill = pendingSkills[i];
      if (!skill) continue;

      setCurrentSkillName(skill.name);
      setProgress(i + 1);

      try {
        const result = await deploySkill(skill);
        if (result.success) {
          const deployment: Deployment = {
            id: crypto.randomUUID(),
            skillId: skill.id,
            targetScope: optionsRef.current.targetScope,
            targetPath: '',
            projectName: optionsRef.current.targetScope === 'project' ? '' : undefined,
            deployedAt: new Date(),
          };
          initialResult.success.push(deployment);
        } else {
          initialResult.failed.push({
            skillId: skill.id,
            skillName: skill.name,
            error: result.error ?? 'Deployment failed',
          });
        }
      } catch (err) {
        initialResult.failed.push({
          skillId: skill.id,
          skillName: skill.name,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    setResult(initialResult);
    setStatus(cancelledRef.current ? 'cancelled' : 'completed');
  }, [deploySkill]);

  const startDeploy = useCallback((
    skills: LibrarySkill[],
    options: BatchDeployOptions
  ): void => {
    if (options.targetScope === 'project' && !options.projectId) {
      console.error('Project ID is required for project scope deployment');
      return;
    }

    cancelledRef.current = false;
    pendingSkillsRef.current = skills;
    optionsRef.current = options;

    setStatus('deploying');
    setProgress(0);
    setTotal(skills.length);
    setCurrentSkillName('');
    setResult(null);

    if (skills.length === 0) {
      setStatus('completed');
      setResult({ success: [], failed: [], cancelled: [] });
      return;
    }

    processQueue();
  }, [processQueue]);

  const cancel = useCallback((): void => {
    cancelledRef.current = true;
    setStatus('cancelled');
  }, []);

  const reset = useCallback((): void => {
    cancelledRef.current = false;
    pendingSkillsRef.current = [];
    optionsRef.current = { targetScope: 'global' };
    setStatus('idle');
    setProgress(0);
    setTotal(0);
    setCurrentSkillName('');
    setResult(null);
  }, []);

  const retryFailed = useCallback((): void => {
    if (!result?.failed.length) {
      return;
    }

    const failedSkills = pendingSkillsRef.current.filter(
      (s) => result.failed.some((f) => f.skillId === s.id)
    );

    if (failedSkills.length > 0) {
      startDeploy(failedSkills, optionsRef.current);
    }
  }, [result, startDeploy]);

  return {
    status,
    progress,
    total,
    currentSkillName,
    result,
    startDeploy,
    cancel,
    reset,
    retryFailed,
  };
}