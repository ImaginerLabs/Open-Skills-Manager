import { useMemo } from 'react';
import { FolderOpen } from '@phosphor-icons/react';
import { SkillListSkeleton } from '../../common/Skeletons/SkillListSkeleton';
import type { Skill, SkillListProps } from './types';
import { SkillListItem } from './SkillListItem';
import { getAnimationDelay } from './hooks/useSkillListAnimation';
import styles from './SkillList.module.scss';

export function SkillList<T extends Skill>({
  skills,
  selectedSkillId,
  onSelect,
  onGetSkillId,
  renderCard,
  isLoading,
  emptyIcon,
  emptyTitle,
  emptyText,
  hasSkills,
}: SkillListProps<T>): React.ReactElement {
  const isEmpty = skills.length === 0 && !isLoading;

  const itemsWithDelay = useMemo(() => {
    return skills.map((skill, index) => ({
      skill,
      delay: getAnimationDelay(index),
    }));
  }, [skills]);

  if (isLoading) {
    return <SkillListSkeleton count={12} />;
  }

  if (isEmpty) {
    return (
      <div className={styles.empty}>
        {emptyIcon ?? <FolderOpen size={48} weight="thin" className={styles.emptyIcon} />}
        {hasSkills ? (
          <>
            <h2 className={styles.emptyTitle}>No matching skills</h2>
            <p className={styles.emptyText}>Try adjusting your search or filters</p>
          </>
        ) : (
          <>
            <h2 className={styles.emptyTitle}>{emptyTitle}</h2>
            <p className={styles.emptyText}>{emptyText}</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {itemsWithDelay.map(({ skill, delay }) => (
        <SkillListItem
          key={onGetSkillId(skill)}
          skill={skill}
          isSelected={selectedSkillId === onGetSkillId(skill)}
          onSelect={onSelect}
          renderCard={renderCard}
          animationDelay={delay}
        />
      ))}
    </div>
  );
}
