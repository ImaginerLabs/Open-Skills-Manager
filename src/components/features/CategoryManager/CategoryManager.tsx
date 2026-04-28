import { useState, useCallback } from 'react';
import { Plus, FolderSimple, PencilSimple, Trash } from '@phosphor-icons/react';
import type { Group } from '../../../stores/libraryStore';
import { useCategoryDragDrop } from '../../../hooks/useCategoryDragDrop';
import { useContextMenu } from '../../../hooks/useContextMenu';
import { ContextMenu, type ContextMenuItem } from '../../common/ContextMenu';
import { CreateEntityDialog } from '../../common/CreateEntityDialog';
import { SidebarItem } from '../../common/SidebarItem';
import { GroupItem, CategoryItem, AddCategoryButton } from './GroupItem';
import styles from './CategoryManager.module.scss';

// Special ID for the "All" group
export const ALL_GROUP_ID = 'grp-all';

export interface CategoryManagerProps {
  groups: Group[];
  selectedGroupId?: string | undefined;
  selectedCategoryId?: string | undefined;
  totalSkillsCount: number;
  onSelectGroup?: (groupId: string) => void;
  onSelectCategory?: (groupId: string, categoryId: string) => void;
  onCreateGroup?: (name: string, icon?: string, notes?: string) => void;
  onRenameGroup?: (groupId: string, newName: string) => void;
  onDeleteGroup?: (groupId: string) => void;
  onCreateCategory?: (groupId: string, name: string, icon?: string, notes?: string) => void;
  onRenameCategory?: (groupId: string, categoryId: string, newName: string) => void;
  onDeleteCategory?: (groupId: string, categoryId: string) => void;
  onOrganizeSkill?: (skillId: string, groupId: string | null, categoryId?: string) => Promise<void>;
}

interface EditingState {
  type: 'group' | 'category';
  groupId: string;
  categoryId?: string | undefined;
  value: string;
}

export function CategoryManager({
  groups,
  selectedGroupId,
  selectedCategoryId,
  totalSkillsCount,
  onSelectGroup,
  onSelectCategory,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
  onOrganizeSkill,
}: CategoryManagerProps): React.ReactElement {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [createDialogType, setCreateDialogType] = useState<'group' | 'category' | null>(null);
  const [creatingCategoryForGroup, setCreatingCategoryForGroup] = useState<string | null>(null);

  const { dragOverState, handleDragOver, handleDragLeave, handleDrop } =
    useCategoryDragDrop(onOrganizeSkill);

  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();

  // Ensure groups is always an array (defensive against corrupted localStorage)
  const safeGroups = Array.isArray(groups) ? groups : [];

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const handleGroupClick = useCallback(
    (groupId: string) => {
      toggleGroup(groupId);
      onSelectGroup?.(groupId);
    },
    [toggleGroup, onSelectGroup]
  );

  const handleCategoryClick = useCallback(
    (groupId: string, categoryId: string) => {
      onSelectCategory?.(groupId, categoryId);
    },
    [onSelectCategory]
  );

  const startEditing = useCallback(
    (type: 'group' | 'category', groupId: string, categoryId?: string, currentValue?: string) => {
      setEditing({ type, groupId, categoryId, value: currentValue || '' });
      closeContextMenu();
    },
    [closeContextMenu]
  );

  const handleEditSubmit = useCallback(() => {
    if (!editing) return;
    const { type, groupId, categoryId, value } = editing;
    if (!value.trim()) {
      setEditing(null);
      return;
    }
    if (type === 'group') {
      onRenameGroup?.(groupId, value.trim());
    } else if (categoryId) {
      onRenameCategory?.(groupId, categoryId, value.trim());
    }
    setEditing(null);
  }, [editing, onRenameGroup, onRenameCategory]);

  const handleDelete = useCallback(() => {
    if (!contextMenu) return;
    const { type, groupId, categoryId } = contextMenu;
    if (type === 'group') {
      onDeleteGroup?.(groupId);
    } else if (categoryId) {
      onDeleteCategory?.(groupId, categoryId);
    }
    closeContextMenu();
  }, [contextMenu, onDeleteGroup, onDeleteCategory, closeContextMenu]);

  const handleCreateEntity = useCallback(
    (name: string, icon?: string, notes?: string) => {
      if (createDialogType === 'group') {
        onCreateGroup?.(name, icon, notes);
      } else if (createDialogType === 'category' && creatingCategoryForGroup) {
        onCreateCategory?.(creatingCategoryForGroup, name, icon, notes);
      }
      setCreateDialogType(null);
      setCreatingCategoryForGroup(null);
    },
    [createDialogType, creatingCategoryForGroup, onCreateGroup, onCreateCategory]
  );

  const handleCloseCreateDialog = useCallback(() => {
    setCreateDialogType(null);
    setCreatingCategoryForGroup(null);
  }, []);

  const openCreateCategoryDialog = useCallback((groupId: string) => {
    setCreatingCategoryForGroup(groupId);
    setCreateDialogType('category');
  }, []);

  const contextMenuItems: ContextMenuItem[] = contextMenu
    ? [
        {
          id: 'rename',
          label: 'Rename',
          icon: PencilSimple,
          onClick: () => {
            const group = safeGroups.find((g) => g.id === contextMenu.groupId);
            const currentValue =
              contextMenu.type === 'group'
                ? group?.name
                : group?.categories.find((c) => c.id === contextMenu.categoryId)?.name;
            startEditing(contextMenu.type, contextMenu.groupId, contextMenu.categoryId, currentValue);
          },
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: Trash,
          variant: 'danger',
          onClick: handleDelete,
        },
      ]
    : [];

  const createDialogParentName =
    createDialogType === 'category' && creatingCategoryForGroup
      ? safeGroups.find((g) => g.id === creatingCategoryForGroup)?.name
      : undefined;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Groups</span>
        <button
          type="button"
          className={styles.addButton}
          onClick={() => setCreateDialogType('group')}
          aria-label="Create group"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className={styles.list}>
        {/* "All" group - special virtual group */}
        <SidebarItem
          name="All"
          icon={<FolderSimple size={16} />}
          count={totalSkillsCount}
          isSelected={selectedGroupId === ALL_GROUP_ID && !selectedCategoryId}
          onClick={() => onSelectGroup?.(ALL_GROUP_ID)}
          className={styles.categoryItem}
        />

        {safeGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          const isSelected = selectedGroupId === group.id && !selectedCategoryId;
          const isEditing = editing?.type === 'group' && editing.groupId === group.id;
          const isDragOver = dragOverState?.groupId === group.id && !dragOverState.categoryId;

          return (
            <div key={group.id} className={styles.categoryWrapper}>
              <GroupItem
                group={group}
                isExpanded={isExpanded}
                isSelected={isSelected}
                isEditing={isEditing}
                isDragOver={isDragOver}
                editingValue={editing?.value || ''}
                onGroupClick={() => handleGroupClick(group.id)}
                onContextMenu={(e) => handleContextMenu(e, 'group', group.id)}
                onDragOver={(e) => handleDragOver(e, group.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, group.id)}
                onEditSubmit={handleEditSubmit}
                onEditCancel={() => setEditing(null)}
                onEditClick={(e) => e.stopPropagation()}
              />

              <div
                className={isExpanded ? styles.groups : styles.groupsCollapsed}
                aria-hidden={!isExpanded}
              >
                <div className={styles.groupsInner}>
                  {group.categories.map((category) => {
                    const isCategorySelected =
                      selectedGroupId === group.id && selectedCategoryId === category.id;
                    const isCategoryEditing =
                      editing?.type === 'category' &&
                      editing.groupId === group.id &&
                      editing.categoryId === category.id;
                    const isCategoryDragOver =
                      dragOverState?.groupId === group.id && dragOverState.categoryId === category.id;

                    return (
                      <CategoryItem
                        key={category.id}
                        category={category}
                        isSelected={isCategorySelected}
                        isEditing={isCategoryEditing}
                        isDragOver={isCategoryDragOver}
                        editingValue={editing?.value || ''}
                        onCategoryClick={() => handleCategoryClick(group.id, category.id)}
                        onContextMenu={(e) => handleContextMenu(e, 'category', group.id, category.id)}
                        onDragOver={(e) => handleDragOver(e, group.id, category.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, group.id, category.id)}
                        onEditSubmit={handleEditSubmit}
                        onEditCancel={() => setEditing(null)}
                        onEditClick={(e) => e.stopPropagation()}
                      />
                    );
                  })}

                  <AddCategoryButton onClick={() => openCreateCategoryDialog(group.id)} />
                </div>
              </div>
            </div>
          );
        })}

        {safeGroups.length === 0 && createDialogType === null && (
          <p className={styles.emptyText}>No groups yet</p>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          isOpen={true}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          items={contextMenuItems}
          onClose={closeContextMenu}
        />
      )}

      <CreateEntityDialog
        open={createDialogType !== null}
        onClose={handleCloseCreateDialog}
        onCreate={handleCreateEntity}
        entityType={createDialogType ?? 'group'}
        parentName={createDialogParentName}
      />
    </div>
  );
}