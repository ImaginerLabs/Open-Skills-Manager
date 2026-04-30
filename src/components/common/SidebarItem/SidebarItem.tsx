import { memo, type ReactNode, type DragEvent, type MouseEvent } from 'react';
import { InlineEditInput } from '@/components/features/CategoryManager/InlineEditInput';
import styles from './SidebarItem.module.scss';

export interface SidebarItemProps {
  name: string;
  icon?: ReactNode;
  count?: number | undefined;

  isSelected?: boolean;
  isDisabled?: boolean;
  isMissing?: boolean;
  isDragOver?: boolean;
  isForbidden?: boolean | undefined;

  expandIcon?: ReactNode;
  isExpanded?: boolean;

  indentLevel?: 0 | 1 | 2;

  onClick?: () => void;
  onContextMenu?: (e: MouseEvent) => void;
  onDragOver?: (e: DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: DragEvent) => void;

  isEditing?: boolean;
  editingValue?: string;
  onEditSubmit?: () => void;
  onEditCancel?: () => void;
  onEditClick?: (e: MouseEvent) => void;

  missingIcon?: ReactNode;

  ariaLabel?: string;
  ariaExpanded?: boolean;

  className?: string | undefined;
}

export const SidebarItem = memo(function SidebarItem({
  name,
  icon,
  count,
  isSelected,
  isDisabled,
  isMissing,
  isDragOver,
  isForbidden,
  expandIcon,
  isExpanded,
  indentLevel = 0,
  onClick,
  onContextMenu,
  onDragOver,
  onDragLeave,
  onDrop,
  isEditing,
  editingValue,
  onEditSubmit,
  onEditCancel,
  onEditClick,
  missingIcon,
  ariaLabel,
  ariaExpanded,
  className,
}: SidebarItemProps): React.ReactElement {
  const itemClasses = [
    styles.sidebarItem,
    isSelected && styles.selected,
    isDisabled && styles.disabled,
    isMissing && styles.missing,
    isDragOver && !isForbidden && styles.dragOver,
    isDragOver && isForbidden && styles.dragOverForbidden,
    indentLevel === 1 && styles.indent1,
    indentLevel === 2 && styles.indent2,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const expandIconClasses = [
    styles.expandIcon,
    isExpanded && styles.expanded,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={itemClasses}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel ?? name}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onClick) {
          onClick();
        }
      }}
    >
      {expandIcon !== undefined ? (
        <span className={expandIconClasses}>{expandIcon}</span>
      ) : (
        <span className={styles.expandIcon} />
      )}

      {isMissing && missingIcon ? (
        <span className={styles.missingIcon}>{missingIcon}</span>
      ) : (
        icon && <span className={styles.icon}>{icon}</span>
      )}

      {isEditing ? (
        <InlineEditInput
          value={editingValue ?? ''}
          placeholder="Name"
          onSubmit={(value) => {
            if (value.trim() && onEditSubmit) {
              onEditSubmit();
            }
          }}
          onCancel={() => {
            if (onEditCancel) {
              onEditCancel();
            }
          }}
          onClick={onEditClick ?? (() => {})}
          autoFocus
        />
      ) : (
        <>
          <span className={styles.name}>{name}</span>
          {count !== undefined && <span className={styles.count}>{count}</span>}
        </>
      )}
    </div>
  );
});