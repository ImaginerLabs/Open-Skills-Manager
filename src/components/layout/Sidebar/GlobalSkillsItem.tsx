import { useState, useCallback, useEffect } from 'react';
import { Globe, Rocket } from '@phosphor-icons/react';
import { NavLink } from 'react-router-dom';
import { ContextMenu, type ContextMenuItem } from '@/components/common/ContextMenu';
import { useProjectStore } from '@/stores/projectStore';
import { useLibraryStore } from '@/stores/libraryStore';
import styles from './GlobalSkillsItem.module.scss';

export interface GlobalSkillsItemProps {
  count: number;
  isSelected: boolean;
  onDeploy?: () => void;
}

export function GlobalSkillsItem({
  count,
  isSelected,
  onDeploy,
}: GlobalSkillsItemProps): React.ReactElement {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const selectProject = useProjectStore((state) => state.selectProject);
  const selectGroup = useLibraryStore((state) => state.selectGroup);

  // Clear project and library selection when this item becomes active (navigating to /global)
  useEffect(() => {
    if (isSelected) {
      const currentProject = useProjectStore.getState().selectedProject;
      const currentGroup = useLibraryStore.getState().selectedGroupId;
      if (currentProject !== null) selectProject(null);
      if (currentGroup !== undefined) selectGroup(undefined);
    }
  }, [isSelected, selectProject, selectGroup]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  const handleDeploy = useCallback(() => {
    setShowMenu(false);
    onDeploy?.();
  }, [onDeploy]);

  const menuItems: ContextMenuItem[] = [
    ...(onDeploy ? [{
      id: 'deploy',
      label: 'Deploy all to...',
      icon: Rocket,
      onClick: handleDeploy,
    }] : []),
  ];

  return (
    <>
      <NavLink
        to="/global"
        draggable={false}
        className={({ isActive }) =>
          [styles.scopeItemLink, (isActive || isSelected) && styles.active].filter(Boolean).join(' ')
        }
        onContextMenu={handleContextMenu}
      >
        <span className={styles.expandIcon} />
        <Globe size={16} />
        <span className={styles.scopeItemName}>Global Skills</span>
        <span className={styles.count}>{count}</span>
      </NavLink>

      <ContextMenu
        isOpen={showMenu}
        position={menuPosition}
        items={menuItems}
        onClose={handleCloseMenu}
      />
    </>
  );
}