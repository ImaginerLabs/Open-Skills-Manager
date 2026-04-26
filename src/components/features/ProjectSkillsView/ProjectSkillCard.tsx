import { useState, useCallback, useRef, useEffect } from 'react';
import { DotsThree, Trash, ArrowDown, FolderOpen } from '@phosphor-icons/react';
import type { ProjectSkill } from '../../../stores/projectStore';
import { formatSize, formatDate } from '../../../utils/formatters';
import styles from './ProjectSkillsView.module.scss';

export interface ProjectSkillCardProps {
  skill: ProjectSkill;
  isSelected?: boolean;
  onSelect?: (skill: ProjectSkill) => void;
  onDelete?: (skillId: string) => void;
  onPull?: (skillId: string) => void;
  style?: React.CSSProperties;
}

interface ContextMenuPosition {
  x: number;
  y: number;
}

export function ProjectSkillCard({
  skill,
  isSelected = false,
  onSelect,
  onDelete,
  onPull,
  style,
}: ProjectSkillCardProps): React.ReactElement {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<ContextMenuPosition>({ x: 0, y: 0 });
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

  const handlePull = useCallback(() => {
    setShowContextMenu(false);
    onPull?.(skill.id);
  }, [onPull, skill.id]);

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
  const formattedDate = skill.installedAt ? formatDate(skill.installedAt) : 'Unknown';

  return (
    <>
      <article
        className={[styles.card, isSelected && styles.selected].filter(Boolean).join(' ')}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={style}
        tabIndex={0}
        role="button"
        aria-label={`Skill: ${skill.name}`}
        aria-selected={isSelected}
      >
        <div className={styles.cardHeader}>
          <h3 className={styles.cardName} title={skill.name}>
            {skill.name}
          </h3>
          <button
            type="button"
            className={styles.cardMenuButton}
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

        <p className={styles.cardDescription} title={skill.description}>
          {skill.description || 'No description'}
        </p>

        <div className={styles.cardMeta}>
          {skill.version && skill.version !== '0.0.0' && (
            <span className={styles.cardVersion}>v{skill.version}</span>
          )}
          {skill.fileCount > 0 && (
            <span className={styles.cardResourceBadge}>
              <FolderOpen size={10} weight="fill" />
              <span>{skill.fileCount} file{skill.fileCount !== 1 ? 's' : ''}</span>
            </span>
          )}
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.cardInfo}>
            <span className={styles.cardSize}>{formattedSize}</span>
            <span className={styles.cardDate}>{formattedDate}</span>
          </div>
          {skill.sourceLibrarySkillId && (
            <span className={styles.cardSourceBadge}>From Library</span>
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
            onClick={handlePull}
            role="menuitem"
          >
            <ArrowDown size={16} />
            <span>Pull to Library</span>
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