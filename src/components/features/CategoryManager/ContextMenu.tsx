import { PencilSimple, Trash } from '@phosphor-icons/react';
import type { Group } from '../../../stores/libraryStore';
import styles from './ContextMenu.module.scss';

export interface ContextMenuProps {
  type: 'group' | 'category';
  groupId: string;
  categoryId?: string | undefined;
  x: number;
  y: number;
  groups: Group[];
  onRename: (type: 'group' | 'category', groupId: string, categoryId?: string | undefined, currentValue?: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ContextMenu({
  type,
  groupId,
  categoryId,
  x,
  y,
  groups,
  onRename,
  onDelete,
  onClose,
}: ContextMenuProps): React.ReactElement {
  const handleRename = () => {
    if (type === 'group') {
      const grp = groups.find((g) => g.id === groupId);
      onRename('group', groupId, undefined, grp?.name);
    } else {
      const grp = groups.find((g) => g.id === groupId);
      const category = grp?.categories.find((c) => c.id === categoryId);
      onRename('category', groupId, categoryId, category?.name);
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