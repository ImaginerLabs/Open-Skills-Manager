import { useState, useCallback } from 'react';
import { FolderOpen, Warning, Trash, Rocket } from '@phosphor-icons/react';
import type { Project } from '@/stores/projectStore';
import { ContextMenu, type ContextMenuItem } from '@/components/common/ContextMenu';
import { SidebarItem } from '@/components/common/SidebarItem';
import styles from './ProjectItem.module.scss';

export interface ProjectItemProps {
  project: Project;
  isSelected: boolean;
  onSelect: (projectId: string) => void;
  onRemove: (projectId: string) => void;
  onDeploy?: (project: Project) => void;
}

export function ProjectItem({
  project,
  isSelected,
  onSelect,
  onRemove,
  onDeploy,
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

  const handleDeploy = useCallback(() => {
    onDeploy?.(project);
    setShowMenu(false);
  }, [onDeploy, project]);

  const handleCloseMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  const menuItems: ContextMenuItem[] = [
    ...(onDeploy && project.exists && project.skillCount > 0 ? [{
      id: 'deploy',
      label: 'Deploy all to...',
      icon: Rocket,
      onClick: handleDeploy,
    }] : []),
    {
      id: 'remove',
      label: 'Remove',
      icon: Trash,
      variant: 'danger' as const,
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
