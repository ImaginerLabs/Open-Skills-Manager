import { useState, useCallback, useEffect, type ReactElement } from 'react';
import { DotsThree, FolderOpen, ArrowDown, Trash } from '@phosphor-icons/react';
import type { ProjectSkill } from '../../../stores/projectStore';
import { formatSize, formatDate } from '../../../utils/formatters';

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface UseProjectSkillContextMenuResult {
  showContextMenu: boolean;
  contextMenuPos: ContextMenuPosition;
  contextSkill: ProjectSkill | null;
  handleContextMenu: (e: React.MouseEvent, skill: ProjectSkill) => void;
  closeContextMenu: () => void;
}

export function useProjectSkillContextMenu(): UseProjectSkillContextMenuResult {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [contextSkill, setContextSkill] = useState<ProjectSkill | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, skill: ProjectSkill) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setContextSkill(skill);
    setShowContextMenu(true);
  }, []);

  const closeContextMenu = useCallback(() => {
    setShowContextMenu(false);
    setContextSkill(null);
  }, []);

  useEffect(() => {
    if (!showContextMenu) return;

    const handleClickOutside = () => {
      closeContextMenu();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showContextMenu, closeContextMenu]);

  return {
    showContextMenu,
    contextMenuPos,
    contextSkill,
    handleContextMenu,
    closeContextMenu,
  };
}

export interface ProjectSkillCardProps {
  skill: ProjectSkill;
  isSelected: boolean;
  onContextMenu: (e: React.MouseEvent, skill: ProjectSkill) => void;
  styles: Record<string, string>;
}

export function ProjectSkillCard({
  skill,
  isSelected,
  onContextMenu,
  styles,
}: ProjectSkillCardProps): ReactElement {
  return (
    <article
      className={[styles.card, isSelected && styles.selected].filter(Boolean).join(' ')}
      onContextMenu={(e) => onContextMenu(e, skill)}
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
            onContextMenu(e, skill);
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
          <span className={styles.cardSize}>{formatSize(skill.size)}</span>
          <span className={styles.cardDate}>
            {skill.installedAt ? formatDate(skill.installedAt) : 'Unknown'}
          </span>
        </div>
        {skill.sourceLibrarySkillId && (
          <span className={styles.cardSourceBadge}>From Library</span>
        )}
      </div>
    </article>
  );
}

export interface SkillContextMenuProps {
  isOpen: boolean;
  position: ContextMenuPosition;
  onDelete: () => void;
  onPull: () => void;
  styles: Record<string, string>;
}

export function SkillContextMenu({
  isOpen,
  position,
  onDelete,
  onPull,
  styles,
}: SkillContextMenuProps): ReactElement | null {
  if (!isOpen) return null;

  return (
    <div
      className={styles.contextMenu}
      style={{ left: position.x, top: position.y }}
      role="menu"
    >
      <button
        type="button"
        className={styles.menuItem}
        onClick={onPull}
        role="menuitem"
      >
        <ArrowDown size={16} />
        <span>Pull to Library</span>
      </button>
      <button
        type="button"
        className={[styles.menuItem, styles.danger].filter(Boolean).join(' ')}
        onClick={onDelete}
        role="menuitem"
      >
        <Trash size={16} />
        <span>Delete</span>
      </button>
    </div>
  );
}
