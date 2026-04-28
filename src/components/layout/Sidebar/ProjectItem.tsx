import { useState, useCallback } from 'react';
import { FolderOpen, Warning, Trash } from '@phosphor-icons/react';
import type { Project } from '@/stores/projectStore';
import { ContextMenu, type ContextMenuItem } from '@/components/common/ContextMenu';
import { SidebarItem } from '@/components/common/SidebarItem';
import styles from './ProjectItem.module.scss';

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
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleClick = useCallback(() => {
    onSelect(project.id);
  }, [onSelect, project.id]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  }, []);

  const handleRemove = useCallback(() => {
    onRemove(project.id);
    setShowMenu(false);
  }, [onRemove, project.id]);

  const handleCloseMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  const menuItems: ContextMenuItem[] = [
    {
      id: 'remove',
      label: 'Remove',
      icon: Trash,
      variant: 'danger',
      onClick: handleRemove,
    },
  ];

  return (
    <>
      <SidebarItem
        name={project.name}
        icon={<FolderOpen size={16} />}
        count={project.exists ? project.skillCount : undefined}
        isSelected={isSelected}
        isMissing={!project.exists}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        missingIcon={<Warning size={16} />}
        ariaLabel={`Project ${project.name}${!project.exists ? ' (missing)' : ''}`}
        className={styles.projectItem}
      />

      <ContextMenu
        isOpen={showMenu}
        position={menuPosition}
        items={menuItems}
        onClose={handleCloseMenu}
      />
    </>
  );
}
