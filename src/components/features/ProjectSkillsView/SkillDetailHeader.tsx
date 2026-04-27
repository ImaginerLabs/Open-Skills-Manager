import { type ReactElement } from 'react';
import { X } from '@phosphor-icons/react';

export interface SkillDetailHeaderProps {
  skillName: string;
  onClose: () => void;
  styles: Record<string, string>;
}

export function SkillDetailHeader({
  skillName,
  onClose,
  styles,
}: SkillDetailHeaderProps): ReactElement {
  const displayName = skillName.replace(/^["']|["']$/g, '');
  return (
    <div className={styles.detailHeader}>
      <h2 className={styles.detailTitle}>{displayName}</h2>
      <button
        type="button"
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Close details"
      >
        <X size={20} />
      </button>
    </div>
  );
}
