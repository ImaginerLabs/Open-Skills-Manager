import { useMemo } from 'react';
import { FolderOpen } from '@phosphor-icons/react';
import { SkillListSkeleton } from '../../common/Skeletons/SkillListSkeleton';
import { useUIStore } from '@/stores';
import type { Skill, SkillListProps } from './types';
import { SkillListItem } from './SkillListItem';
import { getAnimationDelay } from './hooks/useSkillListAnimation';
import styles from './SkillList.module.scss';

export function SkillList<T extends Skill>({
  skills,
  selectedSkillId,
  onSelect,
  onGetSkillId,
  scope,
  actions,
  isLoading,
  emptyIcon,
  emptyTitle,
  emptyText,
  hasSkills,
  onSkillClick,
  searchQuery,
}: SkillListProps<T>): React.ReactElement {
  const { viewMode } = useUIStore();
  const isEmpty = skills.length === 0 && !isLoading;

  // Use viewMode as part of key to trigger re-animation on toggle
  const itemsWithDelay = useMemo(() => {
    return skills.map((skill, index) => ({
      skill,
      delay: getAnimationDelay(index),
    }));
  }, [skills, viewMode]); // Add viewMode dependency to re-trigger animation

  if (isLoading) {
    return <SkillListSkeleton count={12} />;
  }

  if (isEmpty) {
    return (
      <div className={styles.empty} data-testid="empty-state">
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
    <div key={viewMode} className={viewMode === 'list' ? styles.listGrid : styles.grid}>
      {itemsWithDelay.map(({ skill, delay }) => {
        const handleClick = onSkillClick ? () => onSkillClick(skill) : undefined;
        return (
          <SkillListItem
            key={onGetSkillId(skill)}
            skill={skill}
            isSelected={selectedSkillId === onGetSkillId(skill)}
            onSelect={onSelect}
            scope={scope}
            actions={actions}
            animationDelay={delay}
            viewMode={viewMode}
            onClick={handleClick}
            searchQuery={searchQuery}
          />
        );
      })}
    </div>
  );
}
