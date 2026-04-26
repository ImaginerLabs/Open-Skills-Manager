import { useState, useCallback, useRef, useEffect } from 'react';
import { DotsThree, Trash, Export, Rocket, FolderOpen } from '@phosphor-icons/react';
import type { LibrarySkill } from '../../../stores/libraryStore';
import { formatSize, formatDate } from '../../../utils/formatters';
import styles from './SkillCard.module.scss';

export interface SkillCardProps {
  skill: LibrarySkill;
  isSelected?: boolean;
  isDragging?: boolean;
  onSelect?: (skill: LibrarySkill) => void;
  onDelete?: (skillId: string) => void;
  onExport?: (skillId: string) => void;
  onDeploy?: (skill: LibrarySkill) => void;
  onDragStart?: (skill: LibrarySkill) => void;
  onDragEnd?: (skill: LibrarySkill) => void;
}

interface ContextMenuPosition {
  x: number;
  y: number;
}

export function SkillCard({
  skill,
  isSelected = false,
  isDragging = false,
  onSelect,
  onDelete,
  onExport,
  onDeploy,
  onDragStart,
  onDragEnd,
}: SkillCardProps): React.ReactElement {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [isBeingDragged, setIsBeingDragged] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    onSelect?.(skill);
  }, [onSelect, skill]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, []);

  const handleDelete = useCallback(() => {
    setShowContextMenu(false);
    onDelete?.(skill.id);
  }, [onDelete, skill.id]);

  const handleExport = useCallback(() => {
    setShowContextMenu(false);
    onExport?.(skill.id);
  }, [onExport, skill.id]);

  const handleDeploy = useCallback(() => {
    setShowContextMenu(false);
    onDeploy?.(skill);
  }, [onDeploy, skill]);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('application/json', JSON.stringify({
        skillId: skill.id,
        skillName: skill.name,
      }));
      e.dataTransfer.effectAllowed = 'move';
      setIsBeingDragged(true);
      onDragStart?.(skill);
    },
    [skill, onDragStart]
  );

  const handleDragEnd = useCallback(() => {
    setIsBeingDragged(false);
    onDragEnd?.(skill);
  }, [skill, onDragEnd]);

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

  const deploymentCount = skill.deployments.length;
  const formattedSize = formatSize(skill.size);
  const formattedDate = formatDate(skill.importedAt);

  return (
    <>
      <article
        ref={cardRef}
        className={[
          styles.card,
          isSelected && styles.selected,
          (isBeingDragged || isDragging) && styles.dragging,
        ].filter(Boolean).join(' ')}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        draggable
        tabIndex={0}
        role="button"
        aria-label={`Skill: ${skill.name}`}
        aria-selected={isSelected}
      >
        <div className={styles.header}>
          <h3 className={styles.name} title={skill.name}>
            {skill.name}
          </h3>
          <button
            type="button"
            className={styles.menuButton}
            onClick={(e) => {
              e.stopPropagation();
              setContextMenuPos({ x: e.clientX, y: e.clientY });
              setShowContextMenu(true);
            }}
            aria-label="Open context menu"
          >
            <DotsThree size={16} weight="bold" />
          </button>
        </div>

        <p className={styles.description} title={skill.description}>
          {skill.description || 'No description'}
        </p>

        <div className={styles.meta}>
          <span className={styles.version}>v{skill.version}</span>
          {skill.hasResources && (
            <span className={styles.resourceBadge}>
              <FolderOpen size={10} weight="fill" />
              <span>Resources</span>
            </span>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.info}>
            <span className={styles.size}>{formattedSize}</span>
            <span className={styles.date}>{formattedDate}</span>
          </div>
          {deploymentCount > 0 && (
            <span className={styles.deploymentBadge}>
              <Rocket size={12} weight="fill" />
              <span>{deploymentCount}</span>
            </span>
          )}
        </div>
      </article>

      {showContextMenu && (
        <div
          ref={menuRef}
          className={styles.contextMenu}
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          role="menu"
        >
          <button
            type="button"
            className={styles.menuItem}
            onClick={handleDeploy}
            role="menuitem"
          >
            <Rocket size={16} />
            <span>Deploy to...</span>
          </button>
          <button
            type="button"
            className={styles.menuItem}
            onClick={handleExport}
            role="menuitem"
          >
            <Export size={16} />
            <span>Export</span>
          </button>
          <button
            type="button"
            className={[styles.menuItem, styles.danger].filter(Boolean).join(' ')}
            onClick={handleDelete}
            role="menuitem"
          >
            <Trash size={16} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </>
  );
}
