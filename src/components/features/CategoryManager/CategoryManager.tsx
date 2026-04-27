import { useState, useCallback } from 'react';
import { Plus, FolderSimple } from '@phosphor-icons/react';
import type { Category } from '../../../stores/libraryStore';
import { useCategoryDragDrop } from '../../../hooks/useCategoryDragDrop';
import { useContextMenu } from '../../../hooks/useContextMenu';
import { InlineEditInput } from './InlineEditInput';
import { ContextMenu } from './ContextMenu';
import { CategoryItem, GroupItem, AddGroupButton } from './CategoryItem';
import styles from './CategoryManager.module.scss';

// Special ID for the "All" category
export const ALL_CATEGORY_ID = 'cat-all';

export interface CategoryManagerProps {
  categories: Category[];
  selectedCategoryId?: string | undefined;
  selectedGroupId?: string | undefined;
  totalSkillsCount: number;
  onSelectCategory?: (categoryId: string) => void;
  onSelectGroup?: (categoryId: string, groupId: string) => void;
  onCreateCategory?: (name: string) => void;
  onRenameCategory?: (categoryId: string, newName: string) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onCreateGroup?: (categoryId: string, name: string) => void;
  onRenameGroup?: (categoryId: string, groupId: string, newName: string) => void;
  onDeleteGroup?: (categoryId: string, groupId: string) => void;
  onOrganizeSkill?: (skillId: string, categoryId: string | null, groupId?: string) => Promise<void>;
}

interface EditingState {
  type: 'category' | 'group';
  categoryId: string;
  groupId?: string | undefined;
  value: string;
}

export function CategoryManager({
  categories,
  selectedCategoryId,
  selectedGroupId,
  totalSkillsCount,
  onSelectCategory,
  onSelectGroup,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  onOrganizeSkill,
}: CategoryManagerProps): React.ReactElement {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingGroupFor, setIsCreatingGroupFor] = useState<string | null>(null);

  const { dragOverState, handleDragOver, handleDragLeave, handleDrop } =
    useCategoryDragDrop(onOrganizeSkill);

  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();

  // Ensure categories is always an array (defensive against corrupted localStorage)
  const safeCategories = Array.isArray(categories) ? categories : [];

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      toggleCategory(categoryId);
      onSelectCategory?.(categoryId);
    },
    [toggleCategory, onSelectCategory]
  );

  const handleGroupClick = useCallback(
    (categoryId: string, groupId: string) => {
      onSelectGroup?.(categoryId, groupId);
    },
    [onSelectGroup]
  );

  const startEditing = useCallback(
    (type: 'category' | 'group', categoryId: string, groupId?: string, currentValue?: string) => {
      setEditing({ type, categoryId, groupId, value: currentValue || '' });
      closeContextMenu();
    },
    [closeContextMenu]
  );

  const handleEditSubmit = useCallback(() => {
    if (!editing) return;
    const { type, categoryId, groupId, value } = editing;
    if (!value.trim()) {
      setEditing(null);
      return;
    }
    if (type === 'category') {
      onRenameCategory?.(categoryId, value.trim());
    } else if (groupId) {
      onRenameGroup?.(categoryId, groupId, value.trim());
    }
    setEditing(null);
  }, [editing, onRenameCategory, onRenameGroup]);

  const handleDelete = useCallback(() => {
    if (!contextMenu) return;
    const { type, categoryId, groupId } = contextMenu;
    if (type === 'category') {
      onDeleteCategory?.(categoryId);
    } else if (groupId) {
      onDeleteGroup?.(categoryId, groupId);
    }
    closeContextMenu();
  }, [contextMenu, onDeleteCategory, onDeleteGroup, closeContextMenu]);

  const handleCreateCategory = useCallback(
    (name: string) => {
      if (!name.trim()) {
        setIsCreatingCategory(false);
        return;
      }
      onCreateCategory?.(name.trim());
      setIsCreatingCategory(false);
    },
    [onCreateCategory]
  );

  const handleCreateGroup = useCallback(
    (categoryId: string, name: string) => {
      if (!name.trim()) {
        setIsCreatingGroupFor(null);
        return;
      }
      onCreateGroup?.(categoryId, name.trim());
      setIsCreatingGroupFor(null);
    },
    [onCreateGroup]
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Categories</span>
        <button
          type="button"
          className={styles.addButton}
          onClick={() => setIsCreatingCategory(true)}
          aria-label="Create category"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className={styles.list}>
        {/* "All" category - special virtual category */}
        <div
          className={[
            styles.categoryItem,
            selectedCategoryId === ALL_CATEGORY_ID && !selectedGroupId && styles.selected,
          ].filter(Boolean).join(' ')}
          onClick={() => onSelectCategory?.(ALL_CATEGORY_ID)}
          role="button"
          tabIndex={0}
        >
          <span className={styles.expandIcon}>
            <FolderSimple size={16} className={styles.icon} />
          </span>
          <span className={styles.name}>All</span>
          <span className={styles.count}>{totalSkillsCount}</span>
        </div>

        {safeCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const isSelected = selectedCategoryId === category.id && !selectedGroupId;
          const isEditing = editing?.type === 'category' && editing.categoryId === category.id;
          const isDragOver = dragOverState?.categoryId === category.id && !dragOverState.groupId;

          return (
            <div key={category.id} className={styles.categoryWrapper}>
              <CategoryItem
                category={category}
                isExpanded={isExpanded}
                isSelected={isSelected}
                isEditing={isEditing}
                isDragOver={isDragOver}
                editingValue={editing?.value || ''}
                onCategoryClick={() => handleCategoryClick(category.id)}
                onContextMenu={(e) => handleContextMenu(e, 'category', category.id)}
                onDragOver={(e) => handleDragOver(e, category.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, category.id)}
                onEditSubmit={handleEditSubmit}
                onEditCancel={() => setEditing(null)}
                onEditClick={(e) => e.stopPropagation()}
                onMenuClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, 'category', category.id);
                }}
              />

              {isExpanded && (
                <div className={styles.groups}>
                  {category.groups.map((group) => {
                    const isGroupSelected =
                      selectedCategoryId === category.id && selectedGroupId === group.id;
                    const isGroupEditing =
                      editing?.type === 'group' &&
                      editing.categoryId === category.id &&
                      editing.groupId === group.id;
                    const isGroupDragOver =
                      dragOverState?.categoryId === category.id && dragOverState.groupId === group.id;

                    return (
                      <GroupItem
                        key={group.id}
                        group={group}
                        isSelected={isGroupSelected}
                        isEditing={isGroupEditing}
                        isDragOver={isGroupDragOver}
                        editingValue={editing?.value || ''}
                        onGroupClick={() => handleGroupClick(category.id, group.id)}
                        onContextMenu={(e) => handleContextMenu(e, 'group', category.id, group.id)}
                        onDragOver={(e) => handleDragOver(e, category.id, group.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, category.id, group.id)}
                        onEditSubmit={handleEditSubmit}
                        onEditCancel={() => setEditing(null)}
                        onEditClick={(e) => e.stopPropagation()}
                        onMenuClick={(e) => {
                          e.stopPropagation();
                          handleContextMenu(e, 'group', category.id, group.id);
                        }}
                      />
                    );
                  })}

                  <AddGroupButton onClick={() => setIsCreatingGroupFor(category.id)} />

                  {isCreatingGroupFor === category.id && (
                    <InlineEditInput
                      placeholder="Group name"
                      onSubmit={(name) => handleCreateGroup(category.id, name)}
                      onCancel={() => setIsCreatingGroupFor(null)}
                      autoFocus
                      indent
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {safeCategories.length === 0 && !isCreatingCategory && (
          <p className={styles.emptyText}>No categories yet</p>
        )}

        {isCreatingCategory && (
          <InlineEditInput
            placeholder="Category name"
            onSubmit={handleCreateCategory}
            onCancel={() => setIsCreatingCategory(false)}
            autoFocus
          />
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          type={contextMenu.type}
          categoryId={contextMenu.categoryId}
          groupId={contextMenu.groupId}
          x={contextMenu.x}
          y={contextMenu.y}
          categories={safeCategories}
          onRename={startEditing}
          onDelete={handleDelete}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}
