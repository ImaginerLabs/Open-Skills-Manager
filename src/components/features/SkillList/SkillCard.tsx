import { useState, useCallback } from 'react';
import { DotsThree, Trash, Export, Rocket, ArrowDown, Copy, FolderOpen, Link } from '@phosphor-icons/react';
import type { Skill, SkillScope, SkillCardActions, ViewMode } from './types';
import type { LibrarySkill } from '@/stores/libraryStore';
import { formatSize, formatDate } from '@/utils/formatters';
import { ContextMenu, type ContextMenuItem } from '@/components/common/ContextMenu';
import styles from './SkillCard.module.scss';

interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface SkillCardProps<T extends Skill> {
  skill: T;
  isSelected: boolean;
  scope: SkillScope;
  actions?: SkillCardActions<T> | undefined;
  viewMode?: ViewMode | undefined;
  onClick?: (() => void) | undefined;
}

function isLibrarySkill(skill: Skill): skill is LibrarySkill {
  return 'deployments' in skill;
}

function hasSourceLibrarySkillId(skill: Skill): boolean {
  return 'sourceLibrarySkillId' in skill && skill.sourceLibrarySkillId !== undefined;
}

function isSymlinkSkill(skill: Skill): boolean {
  return 'isSymlink' in skill && skill.isSymlink === true;
}

function getSourceBadge(skill: Skill, scope: SkillScope): React.ReactNode {
  if ((scope === 'global' || scope === 'project') && hasSourceLibrarySkillId(skill)) {
    return <span className={styles.sourceBadge}>From Library</span>;
  }
  return null;
}

function getSymlinkBadge(skill: Skill): React.ReactNode {
  if (isSymlinkSkill(skill)) {
    return (
      <span className={styles.symlinkBadge}>
        <Link size={10} weight="bold" />
        <span>Link</span>
      </span>
    );
  }
  return null;
}

export function SkillCard<T extends Skill>({
  skill,
  isSelected,
  scope,
  actions,
  viewMode = 'grid',
  onClick,
}: SkillCardProps<T>): React.ReactElement {
  const [menuPosition, setMenuPosition] = useState<ContextMenuPosition | null>(null);
  const [isBeingDragged, setIsBeingDragged] = useState(false);

  const openMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => {
    setMenuPosition(null);
  }, []);

  const isLibrary = scope === 'library';
  const menuItems: ContextMenuItem[] = [
    ...(isLibrary && actions?.onDeploy ? [{
      id: 'deploy',
      label: 'Deploy to...',
      icon: Rocket,
      onClick: () => actions.onDeploy!(skill),
    }] : []),
    ...(isLibrary && actions?.onExport ? [{
      id: 'export',
      label: 'Export',
      icon: Export,
      onClick: () => actions.onExport!(skill),
    }] : []),
    ...(!isLibrary && actions?.onPull ? [{
      id: 'pull',
      label: 'Pull to Library',
      icon: ArrowDown,
      onClick: () => actions.onPull!(skill.id),
    }] : []),
    ...(!isLibrary && actions?.onExport ? [{
      id: 'export',
      label: 'Export',
      icon: Export,
      onClick: () => actions.onExport!(skill),
    }] : []),
    ...(actions?.onCopyPath ? [{
      id: 'copy-path',
      label: 'Copy Path',
      icon: Copy,
      onClick: () => actions.onCopyPath!(skill.id),
    }] : []),
    ...(actions?.onDelete ? [{
      id: 'delete',
      label: 'Delete',
      icon: Trash,
      variant: 'danger' as const,
      onClick: () => actions.onDelete!(skill.id),
    }] : []),
  ];

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('application/json', JSON.stringify({
        skillId: skill.id,
        skillName: skill.name,
      }));
      e.dataTransfer.effectAllowed = 'move';
      setIsBeingDragged(true);
      actions?.onDragStart?.(skill);
    },
    [skill, actions]
  );

  const handleDragEnd = useCallback(() => {
    setIsBeingDragged(false);
    actions?.onDragEnd?.(skill);
  }, [skill, actions]);

  const formattedSize = formatSize(skill.size);
  const formattedDate = 'importedAt' in skill
    ? formatDate(skill.importedAt)
    : 'installedAt' in skill && skill.installedAt
      ? formatDate(skill.installedAt)
      : 'Unknown';

  const deploymentCount = isLibrarySkill(skill) ? skill.deployments.length : 0;
  const canDrag = scope === 'library';
  const displayName = skill.name.replace(/^["']|["']$/g, '');

  return (
    <>
      <article
        className={[
          styles.card,
          isSelected && styles.selected,
          isBeingDragged && styles.dragging,
          viewMode === 'list' && styles.listMode,
        ].filter(Boolean).join(' ')}
        onContextMenu={openMenu}
        onDragStart={canDrag ? handleDragStart : undefined}
        onDragEnd={canDrag ? handleDragEnd : undefined}
        draggable={canDrag}
        tabIndex={0}
        role="button"
        aria-label={`${scope === 'library' ? '' : scope.charAt(0).toUpperCase() + scope.slice(1) + ' '}skill: ${displayName}`}
        aria-selected={isSelected}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        {viewMode === 'list' ? (
          <>
            <div className={styles.listRow}>
              <h3 className={styles.listName} title={displayName}>
                {displayName}
              </h3>
              {getSymlinkBadge(skill)}
              {skill.fileCount > 0 && (
                <span className={styles.fileCountBadge}>
                  <FolderOpen size={10} weight="fill" />
                  <span>{skill.fileCount}</span>
                </span>
              )}
              {skill.skillMdLines > 0 && (
                <span className={styles.lineCountBadge} title={`${skill.skillMdChars.toLocaleString()} characters`}>
                  <span>{skill.skillMdLines} lines</span>
                </span>
              )}
              {getSourceBadge(skill, scope)}
              <span className={styles.spacer} />
              <span className={styles.size}>{formattedSize}</span>
              <span className={styles.date}>{formattedDate}</span>
              {scope === 'library' && deploymentCount > 0 && (
                <span className={styles.deploymentBadge}>
                  <Rocket size={12} weight="fill" />
                  <span>{deploymentCount}</span>
                </span>
              )}
              {menuItems.length > 0 && (
                <button
                  type="button"
                  className={styles.menuButton}
                  onClick={openMenu}
                  aria-label="Open context menu"
                >
                  <DotsThree size={16} weight="bold" />
                </button>
              )}
            </div>
            <p className={styles.listDescription} title={skill.description}>
              {skill.description || 'No description'}
            </p>
          </>
        ) : (
          <>
            <div className={styles.header}>
              <h3 className={styles.name} title={displayName}>
                {displayName}
              </h3>
              {menuItems.length > 0 && (
                <button
                  type="button"
                  className={styles.menuButton}
                  onClick={openMenu}
                  aria-label="Open context menu"
                >
                  <DotsThree size={16} weight="bold" />
                </button>
              )}
            </div>

            <p className={styles.description} title={skill.description}>
              {skill.description || 'No description'}
            </p>

            <div className={styles.meta}>
              {getSymlinkBadge(skill)}
              {skill.fileCount > 0 && (
                <span className={styles.resourceBadge}>
                  <FolderOpen size={10} weight="fill" />
                  <span>{skill.fileCount} file{skill.fileCount !== 1 ? 's' : ''}</span>
                </span>
              )}
              {skill.skillMdLines > 0 && (
                <span className={styles.docBadge} title={`${skill.skillMdChars.toLocaleString()} characters`}>
                  <span>{skill.skillMdLines} line{skill.skillMdLines !== 1 ? 's' : ''}</span>
                </span>
              )}
              {getSourceBadge(skill, scope)}
            </div>

            <div className={styles.footer}>
              <div className={styles.info}>
                <span className={styles.size}>{formattedSize}</span>
                <span className={styles.date}>{formattedDate}</span>
              </div>
              {scope === 'library' && deploymentCount > 0 && (
                <span className={styles.deploymentBadge}>
                  <Rocket size={12} weight="fill" />
                  <span>{deploymentCount}</span>
                </span>
              )}
            </div>
          </>
        )}
      </article>

      <ContextMenu
        isOpen={menuPosition !== null}
        position={menuPosition ?? { x: 0, y: 0 }}
        items={menuItems}
        onClose={closeMenu}
      />
    </>
  );
}
