import { type ReactElement } from 'react';
import { Trash, ArrowDown } from '@phosphor-icons/react';
import type { ProjectSkill } from '../../../stores/projectStore';

export interface SkillDetailActionsProps {
  skill: ProjectSkill;
  onDelete: (skillId: string) => void;
  onPull: (skillId: string) => void;
  styles: Record<string, string>;
}

export function SkillDetailActions({
  skill,
  onDelete,
  onPull,
  styles,
}: SkillDetailActionsProps): ReactElement {
  return (
    <div className={styles.detailFooter}>
      <button
        type="button"
        className={styles.deleteButton}
        onClick={() => onDelete(skill.id)}
      >
        <Trash size={16} />
        <span>Delete</span>
      </button>
      <button
        type="button"
        className={styles.pullButton}
        onClick={() => onPull(skill.id)}
      >
        <ArrowDown size={16} />
        <span>Pull to Library</span>
      </button>
    </div>
  );
}
