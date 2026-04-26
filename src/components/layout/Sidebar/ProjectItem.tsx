import { useState, useCallback, useRef, useEffect } from 'react';
import { FolderOpen, Warning, DotsThree } from '@phosphor-icons/react';
import type { Project } from '@/stores/projectStore';
import styles from './ProjectItem.module.scss';
import contextMenuStyles from '@/components/features/CategoryManager/ContextMenu.module.scss';

export interface ProjectItemProps {
  project: Project;
  isSelected: boolean;
  onSelect: (projectId: string) => void;
  onRemove: (projectId: string) => void;
}

export function ProjectItem({
  project,
  isSelected,
  onSelect,
  onRemove,
}: ProjectItemProps): React.ReactElement {
  const [showMenu, setShowMenu] = useState(false);

  const handleClick = useCallback(() => {
    onSelect(project.id);
  }, [onSelect, project.id]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(true);
  }, []);

  const handleRemove = useCallback(() => {
    onRemove(project.id);
    setShowMenu(false);
  }, [onRemove, project.id]);

  const handleCloseMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  const itemClasses = [
    styles.projectItem,
    isSelected && styles.selected,
    !project.exists && styles.missing,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div
        className={itemClasses}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        aria-label={`Project ${project.name}${!project.exists ? ' (missing)' : ''}`}
      >
        {project.exists ? (
          <FolderOpen size={18} className={styles.icon} />
        ) : (
          <Warning size={18} className={styles.missingIcon} />
        )}
        <span className={styles.name}>{project.name}</span>
        {project.exists && (
          <span className={styles.count}>{project.skillCount}</span>
        )}
        <button
          className={styles.menuButton}
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(true);
          }}
          aria-label="Project options"
        >
          <DotsThree size={16} weight="bold" />
        </button>
      </div>

      {showMenu && (
        <ContextMenu
          projectName={project.name}
          onRemove={handleRemove}
          onClose={handleCloseMenu}
        />
      )}
    </>
  );
}

interface ContextMenuProps {
  projectName: string;
  onRemove: () => void;
  onClose: () => void;
}

function ContextMenu({
  onRemove,
  onClose,
}: ContextMenuProps): React.ReactElement {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const updatePosition = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 4,
          left: rect.left,
        });
      }
    };
    updatePosition();
  }, []);

  return (
    <>
      <div className={contextMenuStyles.contextOverlay} onClick={onClose} />
      <div
        ref={menuRef}
        className={contextMenuStyles.contextMenu}
        style={{ top: position.top, left: position.left }}
      >
        <button
          className={[contextMenuStyles.menuItem, contextMenuStyles.danger].join(' ')}
          onClick={onRemove}
        >
          Remove
        </button>
      </div>
    </>
  );
}
