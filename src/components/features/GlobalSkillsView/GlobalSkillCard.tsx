import { useState, useCallback, useRef, useEffect } from 'react';
import { DotsThree, Trash, ArrowDown } from '@phosphor-icons/react';
import type { GlobalSkill } from '../../../stores/globalStore';
import { formatSize, formatDate } from '../../../utils/formatters';
import styles from './GlobalSkillsView.module.scss';

export interface GlobalSkillCardProps {
  skill: GlobalSkill;
  isSelected?: boolean;
  onSelect?: (skill: GlobalSkill) => void;
  onDelete?: (skillId: string) => void;
  onPull?: (skill: GlobalSkill) => void;
}

interface ContextMenuPosition {
  x: number;
  y: number;
}

export function GlobalSkillCard({
  skill,
  isSelected = false,
  onSelect,
  onDelete,
  onPull,
}: GlobalSkillCardProps): React.ReactElement {
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
    onPull?.(skill);
  }, [onPull, skill]);

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
        tabIndex={0}
        role="button"
        aria-label={`Global skill: ${skill.name}`}
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
          {skill.version && skill.version !== '0.0.0' && (
            <span className={styles.version}>v{skill.version}</span>
          )}
          {skill.sourceLibrarySkillId && (
            <span className={styles.libraryBadge}>From Library</span>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.info}>
            <span className={styles.size}>{formattedSize}</span>
            <span className={styles.date}>{formattedDate}</span>
          </div>
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
