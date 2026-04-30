import { memo } from 'react';
import { CaretRight, Plus, FolderSimple, FolderOpen } from '@phosphor-icons/react';
import type { Group, Category } from '../../../stores/libraryStore';
import { SidebarItem } from '../../common/SidebarItem';
import { getIconWithDefault } from '../../ui/IconPicker/IconPicker';
import styles from './CategoryManager.module.scss';

interface GroupItemProps {
  group: Group;
  isExpanded: boolean;
  isSelected: boolean;
  isEditing: boolean;
  isDragOver: boolean;
  isForbidden?: boolean;
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

export const GroupItem = memo(function GroupItem({
  group,
  isExpanded,
  isSelected,
  isEditing,
  isDragOver,
  isForbidden,
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
  // Use custom icon if specified, otherwise use folder icon (expanded/collapsed)
  const displayIcon = group.icon
    ? getIconWithDefault(group.icon, group.id, 16)
    : (isExpanded ? <FolderOpen size={16} /> : <FolderSimple size={16} />);

  return (
    <SidebarItem
      name={group.name}
      icon={displayIcon}
      count={group.skillCount}
      isSelected={isSelected}
      isDragOver={isDragOver}
      isForbidden={isForbidden}
      expandIcon={<CaretRight size={12} />}
      isExpanded={isExpanded}
      onClick={onGroupClick}
      onContextMenu={onContextMenu}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      isEditing={isEditing}
      editingValue={editingValue}
      onEditSubmit={onEditSubmit}
      onEditCancel={onEditCancel}
      onEditClick={onEditClick}
      ariaExpanded={isExpanded}
      className={styles.categoryItem}
    />
  );
});

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

export const CategoryItem = memo(function CategoryItem({
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
  // Use custom icon if specified, otherwise use deterministic default icon based on category id
  const displayIcon = getIconWithDefault(category.icon, category.id, 16);

  return (
    <SidebarItem
      name={category.name}
      icon={displayIcon}
      count={category.skillCount}
      isSelected={isSelected}
      isDragOver={isDragOver}
      indentLevel={1}
      onClick={onCategoryClick}
      onContextMenu={onContextMenu}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      isEditing={isEditing}
      editingValue={editingValue}
      onEditSubmit={onEditSubmit}
      onEditCancel={onEditCancel}
      onEditClick={onEditClick}
      className={styles.groupItem}
    />
  );
});

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