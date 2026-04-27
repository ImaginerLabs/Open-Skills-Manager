import { useCallback } from 'react';
import type { Skill, SkillListItemProps } from './types';
import { SkillCard } from './SkillCard';
import styles from './SkillList.module.scss';

export function SkillListItem<T extends Skill>({
  skill,
  isSelected,
  onSelect,
  scope,
  actions,
  animationDelay = 0,
}: SkillListItemProps<T>): React.ReactElement {
  const handleClick = useCallback(() => {
    onSelect(skill);
  }, [onSelect, skill]);

  return (
    <div
      className={styles.listItem}
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <SkillCard
        skill={skill}
        isSelected={isSelected}
        scope={scope}
        actions={actions}
      />
    </div>
  );
}
