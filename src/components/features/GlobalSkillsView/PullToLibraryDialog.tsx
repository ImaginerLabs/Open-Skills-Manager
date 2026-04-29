import { useState, useCallback, useEffect } from 'react';
import { FolderOpen, Folders, Tag, Check, CaretRight } from '@phosphor-icons/react';
import { Modal, ModalFooter } from '../../ui/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import type { GlobalSkill } from '../../../stores/globalStore';
import type { ProjectSkill } from '../../../stores/projectStore';
import { libraryService } from '../../../services/libraryService';
import { useLibraryStore } from '../../../stores/libraryStore';
import { useUIStore } from '../../../stores/uiStore';
import styles from './PullToLibraryDialog.module.scss';

type PullableSkill = GlobalSkill | ProjectSkill;

export interface PullToLibraryDialogProps {
  isOpen: boolean;
  skill: PullableSkill | null;
  onClose: () => void;
  onComplete: () => void;
  projectId?: string | undefined;
}

export function PullToLibraryDialog({
  isOpen,
  skill,
  onClose,
  onComplete,
  projectId,
}: PullToLibraryDialogProps): React.ReactElement | null {
  const [isPulling, setIsPulling] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const { showToast } = useUIStore();
  const { groups, setSkills, setLoading } = useLibraryStore();

  useEffect(() => {
    if (isOpen) {
      setSelectedGroupId(undefined);
      setSelectedCategoryId(undefined);
      setExpandedGroups(new Set());
    }
  }, [isOpen]);

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

  const selectNode = useCallback((groupId: string | undefined, categoryId: string | undefined) => {
    setSelectedGroupId(groupId);
    setSelectedCategoryId(categoryId);
  }, []);

  const handlePull = useCallback(async () => {
    if (!skill) return;

    setIsPulling(true);
    try {
      let result;

      if (projectId) {
        const { projectService } = await import('../../../services/projectService');
        const options: { groupId?: string; categoryId?: string } = {};
        if (selectedGroupId) options.groupId = selectedGroupId;
        if (selectedCategoryId) options.categoryId = selectedCategoryId;
        result = await projectService.pullSkill(projectId, skill.id, options);
      } else {
        result = await libraryService.import({
          path: skill.path,
          groupId: selectedGroupId,
          categoryId: selectedCategoryId,
        });
      }

      if (result.success) {
        showToast('success', `Skill "${skill.name}" pulled to Library`);

        setLoading(true);
        const listResult = await libraryService.list();
        if (listResult.success) {
          setSkills(listResult.data);
        }
        setLoading(false);

        onComplete();
      } else {
        showToast('error', `Failed to pull: ${result.error.message}`);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      showToast('error', `Failed to pull: ${message}`);
    } finally {
      setIsPulling(false);
    }
  }, [skill, projectId, selectedGroupId, selectedCategoryId, showToast, setSkills, setLoading, onComplete]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isPulling) {
        handlePull();
      }
    },
    [isPulling, handlePull]
  );

  if (!skill) return null;

  const isSelected = (groupId: string | undefined, categoryId: string | undefined) =>
    selectedGroupId === groupId && selectedCategoryId === categoryId;

  return (
    <Modal open={isOpen} onClose={onClose} title={`Pull "${skill.name}"`} className={styles.pullDialog} onKeyDown={handleKeyDown}>
      <div className={styles.content}>
        <p className={styles.subtitle}>
          Choose a group and category for this skill, or leave unassigned.
        </p>

        <div className={styles.tree}>
          {/* Root: No group */}
          <button
            type="button"
            className={[styles.treeNode, isSelected(undefined, undefined) && styles.selected].filter(Boolean).join(' ')}
            onClick={() => selectNode(undefined, undefined)}
          >
            <span className={styles.treeIndent} />
            <FolderOpen size={18} weight="duotone" />
            <div className={styles.nodeInfo}>
              <span className={styles.nodeLabel}>No group</span>
              <span className={styles.nodeHint}>Leave unassigned</span>
            </div>
            {isSelected(undefined, undefined) && <Check size={16} weight="bold" className={styles.checkIcon} />}
          </button>

          {groups.map((group) => {
            const isExpanded = expandedGroups.has(group.id);

            return (
              <div key={group.id} className={styles.treeBranch}>
                {/* Group node */}
                <button
                  type="button"
                  className={[
                    styles.treeNode,
                    isSelected(group.id, undefined) && !isExpanded && styles.selected,
                  ].filter(Boolean).join(' ')}
                  onClick={() => {
                    toggleGroup(group.id);
                    if (!isExpanded) {
                      selectNode(group.id, undefined);
                    }
                  }}
                >
                  <button
                    type="button"
                    className={[styles.expandToggle, isExpanded && styles.expanded].filter(Boolean).join(' ')}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroup(group.id);
                    }}
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    <CaretRight size={12} />
                  </button>
                  <Folders size={18} weight="duotone" />
                  <div className={styles.nodeInfo}>
                    <span className={styles.nodeLabel}>{group.name}</span>
                    <span className={styles.nodeHint}>{group.categories.length} categories</span>
                  </div>
                  {isSelected(group.id, undefined) && <Check size={16} weight="bold" className={styles.checkIcon} />}
                </button>

                {/* Category children */}
                {isExpanded && (
                  <div className={styles.treeChildren}>
                    {/* Select group only (no category) */}
                    <button
                      type="button"
                      className={[styles.treeNode, isSelected(group.id, undefined) && styles.selected].filter(Boolean).join(' ')}
                      onClick={() => selectNode(group.id, undefined)}
                    >
                      <span className={styles.treeIndent} />
                      <span className={styles.treeIndent} />
                      <Tag size={16} weight="duotone" />
                      <div className={styles.nodeInfo}>
                        <span className={styles.nodeLabel}>No category</span>
                        <span className={styles.nodeHint}>Add to group only</span>
                      </div>
                      {isSelected(group.id, undefined) && <Check size={16} weight="bold" className={styles.checkIcon} />}
                    </button>

                    {group.categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        className={[styles.treeNode, isSelected(group.id, category.id) && styles.selected].filter(Boolean).join(' ')}
                        onClick={() => selectNode(group.id, category.id)}
                      >
                        <span className={styles.treeIndent} />
                        <span className={styles.treeIndent} />
                        <Tag size={16} weight="duotone" />
                        <div className={styles.nodeInfo}>
                          <span className={styles.nodeLabel}>{category.name}</span>
                        </div>
                        {isSelected(group.id, category.id) && <Check size={16} weight="bold" className={styles.checkIcon} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isPulling}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handlePull} disabled={isPulling}>
          {isPulling ? 'Pulling...' : 'Pull to Library'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
