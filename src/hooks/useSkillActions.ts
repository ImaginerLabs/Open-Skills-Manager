import { useCallback } from 'react';
import { configService } from '../services/configService';
import { useUIStore } from '../stores/uiStore';
import type { Skill, SkillScope } from '../components/features/SkillList/types';

export interface UseSkillActionsOptions<T extends Skill> {
  /** Current scope (library, global, project) */
  scope: SkillScope;
  /** Skills array for lookup */
  skills: T[];
}

export interface UseSkillActionsResult {
  onCopyPath: (skillId: string) => void;
  onReveal: (skillId: string) => void;
}

/**
 * Unified skill actions hook
 *
 * Provides consistent handlers for common skill card actions (copyPath, reveal).
 * Scope-specific actions (delete, export, deploy) should be handled separately.
 */
export function useSkillActions<T extends Skill>(
  options: UseSkillActionsOptions<T>
): UseSkillActionsResult {
  const { skills } = options;
  const { showToast } = useUIStore();

  const handleCopyPath = useCallback(
    async (skillId: string) => {
      const skill = skills.find((s) => s.id === skillId);
      if (skill) {
        try {
          await navigator.clipboard.writeText(skill.path);
          showToast('success', `Copied path: ${skill.path}`);
        } catch {
          showToast('error', 'Failed to copy path');
        }
      }
    },
    [skills, showToast]
  );

  const handleReveal = useCallback(
    async (skillId: string) => {
      const skill = skills.find((s) => s.id === skillId);
      if (skill) {
        try {
          await configService.revealPath(skill.path);
        } catch {
          showToast('error', 'Failed to reveal in Finder');
        }
      }
    },
    [skills, showToast]
  );

  return {
    onCopyPath: handleCopyPath,
    onReveal: handleReveal,
  };
}
