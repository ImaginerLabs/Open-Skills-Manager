import { useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
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

const MENU_WIDTH = 160;
const ITEM_HEIGHT = 32;
const PADDING = 8;

export function ContextMenu({
  isOpen,
  position,
  items,
  onClose,
}: ContextMenuProps): React.ReactElement | null {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const adjustedPosition = useMemo(() => {
    const menuHeight = items.length * ITEM_HEIGHT + PADDING;
    return {
      x: position.x + MENU_WIDTH > window.innerWidth ? position.x - MENU_WIDTH : position.x,
      y: position.y + menuHeight > window.innerHeight ? position.y - menuHeight : position.y,
    };
  }, [position.x, position.y, items.length]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className={styles.contextOverlay}
        onMouseDown={onClose}
        role="presentation"
      />
      <div
        ref={menuRef}
        className={styles.contextMenu}
        style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
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
              onClick={(e) => {
                e.stopPropagation();
                item.onClick?.();
                onClose();
              }}
              role="menuitem"
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>,
    document.body
  );
}
