import { useState, useCallback, useRef } from 'react';
import { invokeIPC } from '@/services/ipcService';
import type { LibrarySkill, Deployment } from '@/stores/libraryStore';

export interface BatchDeployResult {
  success: Deployment[];
  failed: Array<{ skillId: string; skillName: string; error: string }>;
  cancelled: Array<{ skillId: string; skillName: string }>;
}

export interface UseBatchDeployResult {
  status: 'idle' | 'deploying' | 'completed' | 'cancelled';
  progress: number;
  total: number;
  currentSkillName: string;
  result: BatchDeployResult | null;
  startDeploy: (skills: LibrarySkill[], targetScope: 'global' | 'project', projectId?: string) => void;
  cancel: () => void;
  reset: () => void;
  retryFailed: () => void;
}

export function useBatchDeploy(): UseBatchDeployResult {
  const [status, setStatus] = useState<'idle' | 'deploying' | 'completed' | 'cancelled'>('idle');
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentSkillName, setCurrentSkillName] = useState('');
  const [result, setResult] = useState<BatchDeployResult | null>(null);

  const cancelledRef = useRef(false);
  const pendingSkillsRef = useRef<LibrarySkill[]>([]);
  const targetScopeRef = useRef<'global' | 'project'>('global');
  const projectIdRef = useRef<string | undefined>(undefined);

  const deploySkill = useCallback(async (skill: LibrarySkill): Promise<boolean> => {
    const channel = targetScopeRef.current === 'global' ? 'deploy_to_global' : 'deploy_to_project';
    const args = targetScopeRef.current === 'global'
      ? { skillId: skill.id }
      : { skillId: skill.id, projectId: projectIdRef.current };

    const response = await invokeIPC<void>(channel, args);
    return response.success;
  }, []);

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
        const success = await deploySkill(skill);
        if (success) {
          const deployment: Deployment = {
            id: crypto.randomUUID(),
            skillId: skill.id,
            targetScope: targetScopeRef.current,
            targetPath: '',
            projectName: targetScopeRef.current === 'project' ? '' : undefined,
            deployedAt: new Date(),
          };
          initialResult.success.push(deployment);
        } else {
          initialResult.failed.push({
            skillId: skill.id,
            skillName: skill.name,
            error: 'Deployment failed',
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
    targetScope: 'global' | 'project',
    projectId?: string
  ): void => {
    if (targetScope === 'project' && !projectId) {
      return;
    }

    cancelledRef.current = false;
    pendingSkillsRef.current = skills;
    targetScopeRef.current = targetScope;
    projectIdRef.current = projectId;

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
      startDeploy(failedSkills, targetScopeRef.current, projectIdRef.current);
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