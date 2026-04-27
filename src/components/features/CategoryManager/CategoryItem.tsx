import { FolderSimple, FolderOpen, CaretRight, CaretDown, Plus } from '@phosphor-icons/react';
import type { Category, Group } from '../../../stores/libraryStore';
import { InlineEditInput } from './InlineEditInput';
import styles from './CategoryManager.module.scss';

interface CategoryItemProps {
  category: Category;
  isExpanded: boolean;
  isSelected: boolean;
  isEditing: boolean;
  isDragOver: boolean;
  editingValue: string;
  onCategoryClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  onEditClick: (e: React.MouseEvent) => void;
}

export function CategoryItem({
  category,
  isExpanded,
  isSelected,
  isEditing,
  isDragOver,
  editingValue,
  onCategoryClick,
  onContextMenu,
  onDragOver,
  onDragLeave,
  onDrop,
  onEditSubmit,
  onEditCancel,
  onEditClick,
}: CategoryItemProps): React.ReactElement {
  return (
    <div
      className={[
        styles.categoryItem,
        isSelected && styles.selected,
        isDragOver && styles.dragOver,
      ].filter(Boolean).join(' ')}
      onClick={onCategoryClick}
      onContextMenu={onContextMenu}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
    >
      <span className={styles.expandIcon}>
        {isExpanded ? <CaretDown size={12} /> : <CaretRight size={12} />}
      </span>
      {isExpanded ? (
        <FolderOpen size={16} className={styles.icon} />
      ) : (
        <FolderSimple size={16} className={styles.icon} />
      )}
      {isEditing ? (
        <InlineEditInput
          value={editingValue}
          placeholder="Category name"
          onSubmit={onEditSubmit}
          onCancel={onEditCancel}
          onClick={onEditClick}
          autoFocus
        />
      ) : (
        <>
          <span className={styles.name}>{category.name}</span>
          <span className={styles.count}>{category.skillCount}</span>
        </>
      )}
    </div>
  );
}

interface GroupItemProps {
  group: Group;
  isSelected: boolean;
  isEditing: boolean;
  isDragOver: boolean;
  editingValue: string;
  onGroupClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  onEditClick: (e: React.MouseEvent) => void;
}

export function GroupItem({
  group,
  isSelected,
  isEditing,
  isDragOver,
  editingValue,
  onGroupClick,
  onContextMenu,
  onDragOver,
  onDragLeave,
  onDrop,
  onEditSubmit,
  onEditCancel,
  onEditClick,
}: GroupItemProps): React.ReactElement {
  return (
    <div
      className={[
        styles.groupItem,
        isSelected && styles.selected,
        isDragOver && styles.dragOver,
      ].filter(Boolean).join(' ')}
      onClick={onGroupClick}
      onContextMenu={onContextMenu}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
    >
      {/* Spacer to align count with parent category */}
      <span className={styles.groupSpacer} />
      {isEditing ? (
        <InlineEditInput
          value={editingValue}
          placeholder="Group name"
          onSubmit={onEditSubmit}
          onCancel={onEditCancel}
          onClick={onEditClick}
          autoFocus
        />
      ) : (
        <>
          <span className={styles.name}>{group.name}</span>
          <span className={styles.count}>{group.skillCount}</span>
        </>
      )}
    </div>
  );
}

interface AddGroupButtonProps {
  onClick: () => void;
}

export function AddGroupButton({ onClick }: AddGroupButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      className={styles.addGroupButton}
      onClick={onClick}
    >
      <Plus size={12} />
      <span>Add group</span>
    </button>
  );
}