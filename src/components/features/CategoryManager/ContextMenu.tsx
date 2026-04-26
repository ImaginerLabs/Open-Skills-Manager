import { PencilSimple, Trash } from '@phosphor-icons/react';
import type { Category } from '../../../stores/libraryStore';
import styles from './ContextMenu.module.scss';

export interface ContextMenuProps {
  type: 'category' | 'group';
  categoryId: string;
  groupId?: string | undefined;
  x: number;
  y: number;
  categories: Category[];
  onRename: (type: 'category' | 'group', categoryId: string, groupId?: string | undefined, currentValue?: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ContextMenu({
  type,
  categoryId,
  groupId,
  x,
  y,
  categories,
  onRename,
  onDelete,
  onClose,
}: ContextMenuProps): React.ReactElement {
  const handleRename = () => {
    if (type === 'category') {
      const cat = categories.find((c) => c.id === categoryId);
      onRename('category', categoryId, undefined, cat?.name);
    } else {
      const cat = categories.find((c) => c.id === categoryId);
      const group = cat?.groups.find((g) => g.id === groupId);
      onRename('group', categoryId, groupId, group?.name);
    }
  };

  return (
    <>
      <div className={styles.contextOverlay} onClick={onClose} />
      <div
        className={styles.contextMenu}
        style={{ left: x, top: y }}
        role="menu"
      >
        <button
          type="button"
          className={styles.menuItem}
          onClick={handleRename}
          role="menuitem"
        >
          <PencilSimple size={14} />
          <span>Rename</span>
        </button>
        <button
          type="button"
          className={[styles.menuItem, styles.danger].filter(Boolean).join(' ')}
          onClick={onDelete}
          role="menuitem"
        >
          <Trash size={14} />
          <span>Delete</span>
        </button>
      </div>
    </>
  );
}
