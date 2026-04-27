import { useEffect, useRef } from 'react';
import type { Icon } from '@phosphor-icons/react';
import styles from './ContextMenu.module.scss';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon: Icon;
  onClick?: () => void;
  variant?: 'default' | 'danger';
}

export interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({
  isOpen,
  position,
  items,
  onClose,
}: ContextMenuProps): React.ReactElement | null {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleItemClick = (item: ContextMenuItem) => {
    item.onClick?.();
    onClose();
  };

  return (
    <>
      <div
        className={styles.contextOverlay}
        onMouseDown={onClose}
        role="presentation"
      />
      <div
        ref={menuRef}
        className={styles.contextMenu}
        style={{ left: position.x, top: position.y }}
        role="menu"
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={[
                styles.menuItem,
                item.variant === 'danger' && styles.danger,
              ].filter(Boolean).join(' ')}
              onClick={() => handleItemClick(item)}
              role="menuitem"
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
