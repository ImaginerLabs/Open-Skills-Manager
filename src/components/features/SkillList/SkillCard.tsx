import { useState, useCallback, useRef, useEffect } from 'react';
import { DotsThree, Trash, Export, Rocket, ArrowDown, FolderOpen, Link } from '@phosphor-icons/react';
import type { Skill, SkillScope, SkillCardActions, ViewMode } from './types';
import type { LibrarySkill } from '@/stores/libraryStore';
import { formatSize, formatDate } from '@/utils/formatters';
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
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [isBeingDragged, setIsBeingDragged] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, []);

  const handleMenuButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, []);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(false);
    actions?.onDelete?.(skill.id);
  }, [actions, skill.id]);

  const handleExport = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(false);
    actions?.onExport?.(skill.id);
  }, [actions, skill.id]);

  const handleDeploy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(false);
    if (actions?.onDeploy) {
      actions.onDeploy(skill);
    }
  }, [actions, skill]);

  const handlePull = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(false);
    if (actions?.onPull) {
      actions.onPull(skill.id);
    }
  }, [actions, skill.id]);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showContextMenu]);

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
        onContextMenu={handleContextMenu}
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
          // List mode layout
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
              <button
                type="button"
                className={styles.menuButton}
                onClick={handleMenuButtonClick}
                aria-label="Open context menu"
              >
                <DotsThree size={16} weight="bold" />
              </button>
            </div>
            <p className={styles.listDescription} title={skill.description}>
              {skill.description || 'No description'}
            </p>
          </>
        ) : (
          // Grid mode layout (original)
          <>
            <div className={styles.header}>
              <h3 className={styles.name} title={displayName}>
                {displayName}
              </h3>
              <button
                type="button"
                className={styles.menuButton}
                onClick={handleMenuButtonClick}
                aria-label="Open context menu"
              >
                <DotsThree size={16} weight="bold" />
              </button>
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

      {showContextMenu && (
        <div
          ref={menuRef}
          className={styles.contextMenu}
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          role="menu"
        >
          {scope === 'library' && actions?.onDeploy && (
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleDeploy}
              role="menuitem"
            >
              <Rocket size={16} />
              <span>Deploy to...</span>
            </button>
          )}
          {scope === 'library' && actions?.onExport && (
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleExport}
              role="menuitem"
            >
              <Export size={16} />
              <span>Export</span>
            </button>
          )}
          {(scope === 'global' || scope === 'project') && actions?.onPull && (
            <button
              type="button"
              className={styles.menuItem}
              onClick={handlePull}
              role="menuitem"
            >
              <ArrowDown size={16} />
              <span>Pull to Library</span>
            </button>
          )}
          {actions?.onDelete && (
            <button
              type="button"
              className={[styles.menuItem, styles.danger].filter(Boolean).join(' ')}
              onClick={handleDelete}
              role="menuitem"
            >
              <Trash size={16} />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}
