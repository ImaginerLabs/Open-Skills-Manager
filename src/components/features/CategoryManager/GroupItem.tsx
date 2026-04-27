import { FolderSimple, FolderOpen, CaretRight, Plus } from '@phosphor-icons/react';
import type { Group, Category } from '../../../stores/libraryStore';
import { InlineEditInput } from './InlineEditInput';
import styles from './CategoryManager.module.scss';

interface GroupItemProps {
  group: Group;
  isExpanded: boolean;
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
  isExpanded,
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
        styles.categoryItem,
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
      aria-expanded={isExpanded}
    >
      <span className={[styles.expandIcon, isExpanded && styles.expanded].filter(Boolean).join(' ')}>
        <CaretRight size={12} />
      </span>
      {isExpanded ? (
        <FolderOpen size={16} className={styles.icon} />
      ) : (
        <FolderSimple size={16} className={styles.icon} />
      )}
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

interface CategoryItemProps {
  category: Category;
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
        styles.groupItem,
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
    >
      {/* Spacer to align count with parent group */}
      <span className={styles.groupSpacer} />
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

interface AddCategoryButtonProps {
  onClick: () => void;
}

export function AddCategoryButton({ onClick }: AddCategoryButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      className={styles.addGroupButton}
      onClick={onClick}
    >
      <Plus size={12} />
      <span>Add category</span>
    </button>
  );
}