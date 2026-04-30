import { useState, useCallback } from 'react';
import { Globe, Rocket } from '@phosphor-icons/react';
import { NavLink } from 'react-router-dom';
import { ContextMenu, type ContextMenuItem } from '@/components/common/ContextMenu';
import { useSelection } from '@/hooks/useSelection';
import styles from './GlobalSkillsItem.module.scss';

export interface GlobalSkillsItemProps {
  count: number;
  onDeploy?: () => void;
}

/**
 * Global Skills 侧边栏项
 *
 * 重构：移除 useEffect 副作用，改用 useSelection hook
 * 在点击时直接调用选择方法，避免渲染期间的副作用
 */
export function GlobalSkillsItem({
  count,
  onDeploy,
}: GlobalSkillsItemProps): React.ReactElement {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const selection = useSelection();

  // 点击时直接调用选择方法，不再使用 useEffect
  const handleClick = useCallback(() => {
    selection.handleSelectGlobal();
  }, [selection]);

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

  const menuItems: ContextMenuItem[] = onDeploy
    ? [
        {
          id: 'deploy',
          label: 'Deploy all to...',
          icon: Rocket,
          onClick: handleDeploy,
        },
      ]
    : [];

  return (
    <>
      <NavLink
        to="/global"
        draggable={false}
        onClick={handleClick}
        className={({ isActive }) =>
          [styles.scopeItemLink, isActive && styles.active].filter(Boolean).join(' ')
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