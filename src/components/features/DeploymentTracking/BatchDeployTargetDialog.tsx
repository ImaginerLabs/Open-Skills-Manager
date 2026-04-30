import { useState, useCallback, useEffect, useMemo } from 'react';
import { Globe, Folder, Folders, Tag, Check, CaretRight } from '@phosphor-icons/react';
import { Modal, ModalFooter } from '../../ui/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { useIDEStore } from '../../../stores/ideStore';
import { useLibraryStore } from '../../../stores/libraryStore';
import { useProjectStore } from '../../../stores/projectStore';
import type { LibrarySkill } from '../../../types/skill';
import styles from './BatchDeployTargetDialog.module.scss';

export type DeployTargetType = 'library' | 'global' | 'project';

export interface DeployTarget {
  type: DeployTargetType;
  ideId?: string;
  projectId?: string;
  groupId?: string;
  categoryId?: string;
}

export interface BatchDeployTargetDialogProps {
  isOpen: boolean;
  skills: LibrarySkill[];
  sourceInfo?: {
    sourceType: 'library' | 'global' | 'project';
    groupId?: string | undefined;
    categoryId?: string | undefined;
    projectName?: string | undefined;
  };
  onClose: () => void;
  onDeploy: (target: DeployTarget) => void;
}

export function BatchDeployTargetDialog({
  isOpen,
  skills,
  sourceInfo,
  onClose,
  onDeploy,
}: BatchDeployTargetDialogProps): React.ReactElement | null {
  const { ideConfigs, activeIdeId } = useIDEStore();
  const { groups } = useLibraryStore();
  const { projects } = useProjectStore();

  const [selectedType, setSelectedType] = useState<DeployTargetType>('global');
  const [selectedIdeId, setSelectedIdeId] = useState<string>(activeIdeId);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Get enabled IDEs
  const enabledIDEs = useMemo(
    () => ideConfigs.filter((ide) => ide.isEnabled),
    [ideConfigs]
  );

  // Get available IDEs for Global target (exclude current IDE if source is global)
  const availableIDEsForGlobal = useMemo(() => {
    if (sourceInfo?.sourceType === 'global') {
      // Exclude current IDE's global since source is already from there
      return enabledIDEs.filter((ide) => ide.id !== activeIdeId);
    }
    return enabledIDEs;
  }, [sourceInfo?.sourceType, enabledIDEs, activeIdeId]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Default to library for global source (since global target may be empty)
      const defaultType = sourceInfo?.sourceType === 'global' ? 'library' : 'global';
      setSelectedType(defaultType);
      // For global source, select first available IDE (not current)
      const defaultIdeId = sourceInfo?.sourceType === 'global'
        ? (availableIDEsForGlobal[0]?.id ?? activeIdeId)
        : activeIdeId;
      setSelectedIdeId(defaultIdeId);
      setSelectedProjectId(undefined);
      setSelectedGroupId(undefined);
      setSelectedCategoryId(undefined);
      setExpandedGroups(new Set());
    }
  }, [isOpen, activeIdeId, sourceInfo?.sourceType, availableIDEsForGlobal]);

  // Get projects for selected IDE
  const ideProjects = useMemo(() => {
    const ide = ideConfigs.find((i) => i.id === selectedIdeId);
    return ide?.projects ?? projects;
  }, [selectedIdeId, ideConfigs, projects]);

  // Toggle group expansion
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

  // Handle deploy
  const handleDeploy = useCallback(() => {
    const target: DeployTarget = {
      type: selectedType,
    };
    if (selectedType !== 'library' && selectedIdeId) {
      target.ideId = selectedIdeId;
    }
    if (selectedType === 'project' && selectedProjectId) {
      target.projectId = selectedProjectId;
    }
    if (selectedType === 'library') {
      if (selectedGroupId) target.groupId = selectedGroupId;
      if (selectedCategoryId) target.categoryId = selectedCategoryId;
    }
    onDeploy(target);
  }, [selectedType, selectedIdeId, selectedProjectId, selectedGroupId, selectedCategoryId, onDeploy]);

  // Determine which target types are available based on source
  const availableTargetTypes: DeployTargetType[] = useMemo(() => {
    // From any source, can deploy to library, global, or project
    return ['library', 'global', 'project'];
  }, []);

  // Check if can deploy
  const canDeploy = useMemo(() => {
    if (skills.length === 0) return false;
    if (selectedType === 'project' && !selectedProjectId) return false;
    // For Global target from global source, need at least one available IDE
    if (selectedType === 'global' && sourceInfo?.sourceType === 'global' && availableIDEsForGlobal.length === 0) return false;
    return true;
  }, [skills.length, selectedType, selectedProjectId, sourceInfo?.sourceType, availableIDEsForGlobal.length]);

  // Auto-select first available type if current selection is not available
  useEffect(() => {
    if (isOpen && !availableTargetTypes.includes(selectedType)) {
      setSelectedType(availableTargetTypes[0] ?? 'global');
    }
  }, [isOpen, availableTargetTypes, selectedType]);

  // Render IDE selector
  const renderIDESelector = (forGlobalScope = false) => {
    // Use filtered list for Global scope, full list for Project scope
    const ideList = forGlobalScope ? availableIDEsForGlobal : enabledIDEs;
    const emptyMessage = forGlobalScope && sourceInfo?.sourceType === 'global'
      ? 'No other IDEs available (current IDE excluded)'
      : 'No IDEs configured';

    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Target IDE</h3>
        <div className={styles.ideList}>
          {ideList.length === 0 ? (
            <div className={styles.empty}>
              <Globe size={24} weight="thin" />
              <span>{emptyMessage}</span>
            </div>
          ) : (
            ideList.map((ide) => (
              <button
                key={ide.id}
                type="button"
                className={[
                  styles.targetCard,
                  selectedIdeId === ide.id && styles.selected,
                ].filter(Boolean).join(' ')}
                onClick={() => setSelectedIdeId(ide.id)}
              >
                <Globe size={20} weight="duotone" />
                <div className={styles.targetInfo}>
                  <span className={styles.targetName}>
                    {ide.name}
                    {ide.id === activeIdeId && <span className={styles.currentBadge}>Current</span>}
                  </span>
                  <span className={styles.targetPath}>{ide.globalScopePath}</span>
                </div>
                {selectedIdeId === ide.id && <Check size={18} weight="bold" className={styles.checkIcon} />}
              </button>
            ))
          )}
        </div>
      </div>
    );
  };

  // Render project list
  const renderProjectList = () => (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Select Project</h3>
      <div className={styles.projectList}>
        {ideProjects.length === 0 ? (
          <div className={styles.empty}>
            <Folder size={24} weight="thin" />
            <span>No projects found</span>
          </div>
        ) : (
          ideProjects.map((project) => (
            <button
              key={project.id}
              type="button"
              className={[
                styles.targetCard,
                selectedProjectId === project.id && styles.selected,
              ].filter(Boolean).join(' ')}
              onClick={() => setSelectedProjectId(project.id)}
            >
              <Folder size={20} weight="duotone" />
              <div className={styles.targetInfo}>
                <span className={styles.targetName}>{project.name}</span>
                <span className={styles.targetPath}>{project.path}</span>
              </div>
              {selectedProjectId === project.id && <Check size={18} weight="bold" className={styles.checkIcon} />}
            </button>
          ))
        )}
      </div>
    </div>
  );

  // Render library tree
  const renderLibraryTree = () => (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Select Group/Category</h3>
      <div className={styles.tree}>
        {/* Root: No group */}
        <button
          type="button"
          className={[
            styles.treeNode,
            selectedGroupId === undefined && selectedCategoryId === undefined && styles.selected,
          ].filter(Boolean).join(' ')}
          onClick={() => {
            setSelectedGroupId(undefined);
            setSelectedCategoryId(undefined);
          }}
        >
          <span className={styles.treeIndent} />
          <Folders size={18} weight="duotone" />
          <div className={styles.nodeInfo}>
            <span className={styles.nodeLabel}>No group</span>
            <span className={styles.nodeHint}>Leave unassigned</span>
          </div>
          {selectedGroupId === undefined && selectedCategoryId === undefined && (
            <Check size={16} weight="bold" className={styles.checkIcon} />
          )}
        </button>

        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          const isSelected = selectedGroupId === group.id && !selectedCategoryId;

          return (
            <div key={group.id} className={styles.treeBranch}>
              {/* Group node */}
              <button
                type="button"
                className={[
                  styles.treeNode,
                  isSelected && !isExpanded && styles.selected,
                ].filter(Boolean).join(' ')}
                onClick={() => {
                  toggleGroup(group.id);
                  if (!isExpanded) {
                    setSelectedGroupId(group.id);
                    setSelectedCategoryId(undefined);
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
                {isSelected && <Check size={16} weight="bold" className={styles.checkIcon} />}
              </button>

              {/* Category children */}
              {isExpanded && (
                <div className={styles.treeChildren}>
                  {/* Select group only (no category) */}
                  <button
                    type="button"
                    className={[
                      styles.treeNode,
                      selectedGroupId === group.id && selectedCategoryId === undefined && styles.selected,
                    ].filter(Boolean).join(' ')}
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setSelectedCategoryId(undefined);
                    }}
                  >
                    <span className={styles.treeIndent} />
                    <span className={styles.treeIndent} />
                    <Tag size={16} weight="duotone" />
                    <div className={styles.nodeInfo}>
                      <span className={styles.nodeLabel}>No category</span>
                      <span className={styles.nodeHint}>Add to group only</span>
                    </div>
                    {selectedGroupId === group.id && selectedCategoryId === undefined && (
                      <Check size={16} weight="bold" className={styles.checkIcon} />
                    )}
                  </button>

                  {group.categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={[
                        styles.treeNode,
                        selectedGroupId === group.id && selectedCategoryId === category.id && styles.selected,
                      ].filter(Boolean).join(' ')}
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        setSelectedCategoryId(category.id);
                      }}
                    >
                      <span className={styles.treeIndent} />
                      <span className={styles.treeIndent} />
                      <Tag size={16} weight="duotone" />
                      <div className={styles.nodeInfo}>
                        <span className={styles.nodeLabel}>{category.name}</span>
                      </div>
                      {selectedGroupId === group.id && selectedCategoryId === category.id && (
                        <Check size={16} weight="bold" className={styles.checkIcon} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={onClose} title={`Deploy ${skills.length} Skills`} className={styles.dialog}>
      <div className={styles.content}>
        <p className={styles.subtitle}>
          {sourceInfo?.sourceType === 'library' && sourceInfo?.groupId && 'Select where to copy these skills'}
          {sourceInfo?.sourceType === 'global' && 'Select deployment target for Global Skills'}
          {sourceInfo?.sourceType === 'project' && `Deploy from ${sourceInfo?.projectName ?? 'Project'}`}
          {!sourceInfo && 'Select deployment target'}
        </p>

        {/* Target type tabs */}
        <div className={styles.typeTabs}>
          {availableTargetTypes.includes('library') && (
            <button
              type="button"
              className={[styles.typeTab, selectedType === 'library' && styles.active].filter(Boolean).join(' ')}
              onClick={() => setSelectedType('library')}
            >
              <Folders size={16} />
              <span>Library</span>
            </button>
          )}
          {availableTargetTypes.includes('global') && (
            <button
              type="button"
              className={[styles.typeTab, selectedType === 'global' && styles.active].filter(Boolean).join(' ')}
              onClick={() => setSelectedType('global')}
            >
              <Globe size={16} />
              <span>Global</span>
            </button>
          )}
          {availableTargetTypes.includes('project') && (
            <button
              type="button"
              className={[styles.typeTab, selectedType === 'project' && styles.active].filter(Boolean).join(' ')}
              onClick={() => setSelectedType('project')}
            >
              <Folder size={16} />
              <span>Project</span>
            </button>
          )}
        </div>

        {/* Target selection based on type */}
        {selectedType === 'library' && renderLibraryTree()}
        {selectedType === 'global' && renderIDESelector(true)}
        {selectedType === 'project' && (
          <>
            {renderIDESelector()}
            {renderProjectList()}
          </>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleDeploy} disabled={!canDeploy}>
          Deploy
        </Button>
      </ModalFooter>
    </Modal>
  );
}