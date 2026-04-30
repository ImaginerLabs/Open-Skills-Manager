import { useState, useCallback, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Globe,
  Gear,
  MagnifyingGlass,
  CaretRight,
} from '@phosphor-icons/react';
import { useShallow } from 'zustand/react/shallow';
import { CategoryManager, ALL_GROUP_ID } from '../../features/CategoryManager';
import { ProjectListContainer } from '../Sidebar/ProjectListContainer';
import { GlobalSkillsItem } from '../Sidebar/GlobalSkillsItem';
import { ICloudStatus } from '../TopBar/ICloudStatus';
import { IDESwitcher } from '../../common/IDESwitcher/IDESwitcher';
import { SearchOverlay } from '../../features/SearchOverlay';
import { ExportDialog, type ExportableSkill } from '../../features/ExportDialog';
import { BatchDeployTargetDialog, BatchDeployDialog, type DeployTarget } from '../../features/DeploymentTracking';
import type { SearchResult } from '../../../stores/uiStore';
import { useLibraryStore, type LibrarySkill } from '../../../stores/libraryStore';
import { useProjectStore, type Project } from '../../../stores/projectStore';
import { useGlobalStore } from '../../../stores/globalStore';
import { useUIStore } from '../../../stores/uiStore';
import { useCategoryManager } from '../../../hooks/useCategoryManager';
import { useIcloudSync } from '../../../hooks/useIcloudSync';
import { useSearchKeyboard } from '../../../hooks/useSearchKeyboard';
import { useBatchDeploy } from '../../../hooks/useBatchDeploy';
import { useSidebarData } from '../../../hooks/useSidebarData';
import { useSelection } from '../../../hooks/useSelection';
import { libraryService } from '../../../services/libraryService';
import { globalService } from '../../../services/globalService';
import { configService } from '../../../services/configService';
import { toLibrarySkillFormat } from '../../../utils/skillConverters';
import styles from './MainLayout.module.scss';
import { Input } from '../../ui';

export interface MainLayoutProps {
  children?: React.ReactNode;
}

interface NavSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  path: string;
  expanded: boolean;
}

export function MainLayout({ children }: MainLayoutProps): React.ReactElement {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['library', 'scopes'])
  );
  const location = useLocation();

  // Use unified selection hook
  const selection = useSelection();

  const { groups, updateSkill, selectedGroupId, selectedCategoryId, skills } = useLibraryStore(
    useShallow((state) => ({
      groups: state.groups,
      updateSkill: state.updateSkill,
      selectedGroupId: state.selectedGroupId,
      selectedCategoryId: state.selectedCategoryId,
      skills: state.skills,
    }))
  );
  const { skills: globalSkills } = useGlobalStore();
  const { projects } = useProjectStore();
  const { showToast, showConfirmDialog, closeConfirmDialog } = useUIStore(
    useShallow((state) => ({
      showToast: state.showToast,
      showConfirmDialog: state.showConfirmDialog,
      closeConfirmDialog: state.closeConfirmDialog,
    }))
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const categoryManager = useCategoryManager();
  const { status: syncStatus, lastSyncTime, pendingChanges } = useIcloudSync();
  const { openSearch } = useSearchKeyboard();
  const { refreshAll, refreshLibrary, refreshGlobal } = useSidebarData();

  // Batch deploy state
  const [showBatchTargetDialog, setShowBatchTargetDialog] = useState(false);
  const [batchDeploySkills, setBatchDeploySkills] = useState<LibrarySkill[]>([]);
  const [batchDeploySourceInfo, setBatchDeploySourceInfo] = useState<{
    sourceType: 'library' | 'global' | 'project';
    groupId?: string | undefined;
    categoryId?: string | undefined;
    projectName?: string | undefined;
  }>({ sourceType: 'library' });
  const [exportSkills, setExportSkills] = useState<ExportableSkill[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const {
    status: batchDeployStatus,
    progress: batchDeployProgress,
    total: batchDeployTotal,
    currentSkillName: batchDeployCurrentSkill,
    result: batchDeployResult,
    startDeploy: startBatchDeploy,
    cancel: cancelBatchDeploy,
    reset: resetBatchDeploy,
    retryFailed: retryBatchDeployFailed,
  } = useBatchDeploy();

  // Initialize default selection and load data on mount
  useEffect(() => {
    selection.ensureDefaultSelection();
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear selections when navigating to Settings page
  useEffect(() => {
    if (location.pathname === '/settings') {
      // 直接调用 store 方法，避免依赖 selection 对象
      selection.handleClearSelection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const navSections: NavSection[] = [
    {
      id: 'library',
      title: 'Library',
      icon: <BookOpen size={18} />,
      path: '/library',
      expanded: expandedSections.has('library'),
    },
    {
      id: 'scopes',
      title: 'Scopes',
      icon: <Globe size={18} />,
      path: '/global',
      expanded: expandedSections.has('scopes'),
    },
  ];

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // Use selection hook for group/category selection
  const handleSelectGroup = useCallback((groupId: string) => {
    selection.handleSelectLibrary(groupId);
  }, [selection]);

  const handleSelectCategory = useCallback((groupId: string, categoryId: string) => {
    selection.handleSelectLibrary(groupId, categoryId);
  }, [selection]);

  const handleCreateGroup = useCallback(
    (name: string, icon?: string, notes?: string) => {
      categoryManager.createGroup(name, icon, notes);
    },
    [categoryManager]
  );

  const handleRenameGroup = useCallback(
    (groupId: string, newName: string) => {
      categoryManager.renameGroup(groupId, newName);
    },
    [categoryManager]
  );

  const handleDeleteGroup = useCallback(
    (groupId: string) => {
      categoryManager.deleteGroup(groupId).then((success) => {
        if (success && selectedGroupId === groupId) {
          selection.handleSelectLibrary(undefined);
        }
      });
    },
    [categoryManager, selectedGroupId, selection]
  );

  const handleCreateCategory = useCallback(
    (groupId: string, name: string, icon?: string, notes?: string) => {
      categoryManager.createCategory(groupId, name, icon, notes);
    },
    [categoryManager]
  );

  const handleRenameCategory = useCallback(
    (groupId: string, categoryId: string, newName: string) => {
      categoryManager.renameCategory(groupId, categoryId, newName);
    },
    [categoryManager]
  );

  const handleDeleteCategory = useCallback(
    (groupId: string, categoryId: string) => {
      categoryManager.deleteCategory(groupId, categoryId).then((success) => {
        if (success && selectedCategoryId === categoryId) {
          selection.handleSelectLibrary(selectedGroupId, undefined);
        }
      });
    },
    [categoryManager, selectedCategoryId, selectedGroupId, selection]
  );

  const handleOrganizeSkill = useCallback(
    async (skillId: string, groupId: string | null, categoryId?: string) => {
      try {
        const result = await libraryService.organize(skillId, groupId ?? undefined, categoryId);
        if (result.success) {
          const updates: Partial<{ groupId: string; categoryId: string }> = {};
          if (groupId) updates.groupId = groupId;
          if (categoryId) updates.categoryId = categoryId;
          updateSkill(skillId, updates);
          const group = groups.find((g) => g.id === groupId);
          const category = group?.categories.find((c) => c.id === categoryId);
          const locationName = category
            ? `${group?.name} / ${category.name}`
            : group?.name ?? 'Uncategorized';
          showToast('success', `Skill moved to ${locationName}`);
          // Refresh sidebar to update counts
          refreshLibrary();
        } else {
          showToast('error', result.error.message);
        }
      } catch (e) {
        showToast('error', e instanceof Error ? e.message : 'Failed to organize skill');
      }
    },
    [updateSkill, groups, showToast, refreshLibrary]
  );

  // Drag-drop handlers for organizing skills
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, groupId?: string, categoryId?: string) => {
      e.preventDefault();
      setIsDragOver(false);

      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      try {
        const { skillId } = JSON.parse(data) as { skillId: string; skillName: string };
        await handleOrganizeSkill(skillId, groupId ?? null, categoryId);
      } catch (error) {
        console.error('Failed to organize skill:', error);
      }
    },
    [handleOrganizeSkill]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          `input[placeholder="Search skills..."]`
        );
        searchInput?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search result actions
  const handleSearchDeploy = useCallback(
    async (result: SearchResult) => {
      if (result.scope === 'library') {
        const res = await libraryService.get(result.id);
        if (res.success && res.data) {
          setBatchDeploySkills([res.data]);
          setBatchDeploySourceInfo({ sourceType: 'library' });
          setShowBatchTargetDialog(true);
        } else {
          showToast('error', 'Failed to load skill data');
        }
      } else {
        // For global/project scope, use BatchDeployTargetDialog
        setBatchDeploySkills([toLibrarySkillFormat(result)]);
        const projectName = result.projectId
          ? projects.find((p) => p.id === result.projectId)?.name
          : undefined;
        setBatchDeploySourceInfo({
          sourceType: result.scope,
          projectName: projectName ?? undefined,
        });
        setShowBatchTargetDialog(true);
      }
    },
    [showToast, projects]
  );

  const handleSearchExport = useCallback(
    async (result: SearchResult) => {
      if (result.scope === 'library') {
        const res = await libraryService.get(result.id);
        if (res.success && res.data) {
          setExportSkills([res.data]);
          setShowExportDialog(true);
        } else {
          showToast('error', 'Failed to load skill data');
        }
      } else {
        setExportSkills([{ id: result.id, name: result.name, path: result.path, scope: result.scope as 'global' | 'project' }]);
        setShowExportDialog(true);
      }
    },
    [showToast]
  );

  const handleExportStart = useCallback(
    async (format: 'zip' | 'folder', skillsToExport: ExportableSkill[]) => {
      setShowExportDialog(false);
      for (const skill of skillsToExport) {
        const isLibrary = !skill.scope || skill.scope === 'library';
        const exportResult = isLibrary
          ? await libraryService.export(skill.id, format, skill.name)
          : await libraryService.exportFromPath(skill.path!, skill.name, format);
        if (exportResult?.success) {
          showToast('success', `Exported ${skill.name}`);
        } else if (exportResult?.error) {
          showToast('error', exportResult.error.message);
        }
      }
    },
    [showToast]
  );

  const handleExportClose = useCallback(() => {
    setShowExportDialog(false);
    setExportSkills([]);
  }, []);

  const handleSearchCopyPath = useCallback(
    async (result: SearchResult) => {
      try {
        await navigator.clipboard.writeText(result.path);
        showToast('success', `Copied path: ${result.path}`);
      } catch {
        showToast('error', 'Failed to copy path');
      }
    },
    [showToast]
  );

  const handleSearchReveal = useCallback(
    async (result: SearchResult) => {
      try {
        await configService.revealPath(result.path);
      } catch {
        showToast('error', 'Failed to reveal in Finder');
      }
    },
    [showToast]
  );

  const handleSearchDelete = useCallback(
    async (result: SearchResult) => {
      showConfirmDialog({
        title: 'Delete Skill',
        message: `Are you sure you want to delete "${result.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: async () => {
          closeConfirmDialog();
          if (result.scope === 'library') {
            const deleteResult = await libraryService.delete(result.id);
            if (deleteResult.success) {
              showToast('success', `Deleted ${result.name}`);
              refreshLibrary();
            } else {
              showToast('error', deleteResult.error.message);
            }
          } else if (result.scope === 'global') {
            const deleteResult = await globalService.delete(result.id);
            if (deleteResult.success) {
              showToast('success', `Deleted ${result.name}`);
              refreshGlobal();
            } else {
              showToast('error', deleteResult.error.message);
            }
          }
        },
      });
    },
    [showToast, showConfirmDialog, closeConfirmDialog, refreshLibrary, refreshGlobal]
  );

  // Batch deploy handlers
  const handleBatchDeployFromCategory = useCallback(
    async (groupId: string, categoryId?: string) => {
      // Get skills for this group/category
      let filteredSkills: LibrarySkill[];

      if (groupId === ALL_GROUP_ID) {
        // Deploy all skills
        filteredSkills = skills;
      } else {
        filteredSkills = skills.filter((skill) => {
          if (categoryId) {
            return skill.groupId === groupId && skill.categoryId === categoryId;
          }
          return skill.groupId === groupId;
        });
      }

      if (filteredSkills.length === 0) {
        showToast('info', 'No skills in this category to deploy');
        return;
      }

      setBatchDeploySkills(filteredSkills);
      const sourceInfo: { sourceType: 'library' | 'global' | 'project'; groupId?: string; categoryId?: string } = {
        sourceType: 'library',
        groupId,
      };
      if (categoryId) sourceInfo.categoryId = categoryId;
      setBatchDeploySourceInfo(sourceInfo);
      setShowBatchTargetDialog(true);
    },
    [skills, showToast]
  );

  const handleBatchDeployTarget = useCallback(
    async (target: DeployTarget) => {
      setShowBatchTargetDialog(false);

      if (target.type === 'library') {
        // If source is global or project, import to library
        if (batchDeploySourceInfo.sourceType === 'global' || batchDeploySourceInfo.sourceType === 'project') {
          for (const skill of batchDeploySkills) {
            const result = await libraryService.import({
              path: skill.path,
              groupId: target.groupId,
              categoryId: target.categoryId,
            });
            if (result.success) {
              showToast('success', `Skill "${skill.name}" added to Library`);
            } else {
              showToast('error', `Failed to add "${skill.name}" to Library: ${result.error.message}`);
            }
          }
          // Refresh sidebar counts
          refreshLibrary();
          resetBatchDeploy();
        } else {
          // Copy within library - update skill metadata
          const updates: Array<{ skillId: string; groupId?: string; categoryId?: string }> = [];
          for (const skill of batchDeploySkills) {
            const result = await libraryService.organize(skill.id, target.groupId, target.categoryId);
            if (result.success) {
              const update: { skillId: string; groupId?: string; categoryId?: string } = { skillId: skill.id };
              if (target.groupId) update.groupId = target.groupId;
              if (target.categoryId) update.categoryId = target.categoryId;
              updates.push(update);
            }
          }
          if (updates.length > 0) {
            showToast('success', `Moved ${updates.length} skills`);
            // Refresh sidebar counts
            refreshLibrary();
          }
          resetBatchDeploy();
        }
      } else if (target.type === 'global') {
        // Deploy to global
        const options: { targetScope: 'global'; targetIdeId?: string; sourceScope?: 'library' | 'global' | 'project' } = {
          targetScope: 'global',
        };
        if (target.ideId) options.targetIdeId = target.ideId;
        if (batchDeploySourceInfo.sourceType) {
          options.sourceScope = batchDeploySourceInfo.sourceType;
        }
        startBatchDeploy(batchDeploySkills, options);
      } else if (target.type === 'project') {
        // Deploy to project
        const options: { targetScope: 'project'; targetIdeId?: string; projectId?: string; sourceScope?: 'library' | 'global' | 'project' } = {
          targetScope: 'project',
        };
        if (target.ideId) options.targetIdeId = target.ideId;
        if (target.projectId) options.projectId = target.projectId;
        if (batchDeploySourceInfo.sourceType) {
          options.sourceScope = batchDeploySourceInfo.sourceType;
        }
        startBatchDeploy(batchDeploySkills, options);
      }
    },
    [batchDeploySkills, batchDeploySourceInfo, startBatchDeploy, showToast, refreshLibrary, resetBatchDeploy]
  );

  const handleBatchDeployDialogClose = useCallback(() => {
    resetBatchDeploy();
  }, [resetBatchDeploy]);

  // Refresh sidebar counts when batch deploy completes
  useEffect(() => {
    if (batchDeployStatus === 'completed' && batchDeployResult) {
      refreshAll();
    }
  }, [batchDeployStatus, batchDeployResult, refreshAll]);

  // Handle deploying all global skills
  const handleDeployAllGlobalSkills = useCallback(() => {
    if (globalSkills.length === 0) {
      showToast('info', 'No global skills to deploy');
      return;
    }
    // Convert global skills to library skill format for the dialog
    const skillsToDeploy = globalSkills.map((skill) => toLibrarySkillFormat(skill));
    setBatchDeploySkills(skillsToDeploy);
    setBatchDeploySourceInfo({ sourceType: 'global' });
    setShowBatchTargetDialog(true);
  }, [globalSkills, showToast]);

  // Handle deploying project skills
  const handleDeployProjectSkills = useCallback((_project: Project, skillsToDeploy: LibrarySkill[]) => {
    if (skillsToDeploy.length === 0) {
      showToast('info', 'No skills to deploy');
      return;
    }
    setBatchDeploySkills(skillsToDeploy);
    setBatchDeploySourceInfo({ sourceType: 'project', projectName: _project.name });
    setShowBatchTargetDialog(true);
  }, [showToast]);

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <BookOpen size={24} weight="fill" />
            <span>Skills Manager</span>
          </div>
        </div>
        <nav className={styles.sidebarNav}>
          {navSections.map((section) => (
            <div key={section.id} className={styles.navSection}>
              <button
                type="button"
                className={styles.navSectionHeader}
                onClick={() => toggleSection(section.id)}
                aria-expanded={section.expanded}
              >
                <span className={[styles.expandIcon, section.expanded && styles.expanded].filter(Boolean).join(' ')}>
                  <CaretRight size={12} />
                </span>
                <span className={styles.navSectionTitle}>{section.title}</span>
              </button>

              <div
                className={section.expanded ? styles.sectionContent : styles.sectionContentCollapsed}
                aria-hidden={!section.expanded}
              >
                <div className={styles.sectionContentInner}>
                  {section.id === 'library' && (
                    <div
                      className={[styles.categoryContainer, isDragOver && styles.dragOver].filter(Boolean).join(' ')}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e)}
                    >
                      <CategoryManager
                        groups={groups}
                        selectedGroupId={selectedGroupId}
                        selectedCategoryId={selectedCategoryId}
                        totalSkillsCount={skills?.length ?? 0}
                        onSelectGroup={handleSelectGroup}
                        onSelectCategory={handleSelectCategory}
                        onCreateGroup={handleCreateGroup}
                        onRenameGroup={handleRenameGroup}
                        onDeleteGroup={handleDeleteGroup}
                        onCreateCategory={handleCreateCategory}
                        onRenameCategory={handleRenameCategory}
                        onDeleteCategory={handleDeleteCategory}
                        onOrganizeSkill={handleOrganizeSkill}
                        onBatchDeploy={handleBatchDeployFromCategory}
                      />
                    </div>
                  )}

                  {section.id === 'scopes' && (
                    <div className={styles.scopeList}>
                      <div className={styles.scopeListInner}>
                        <div className={styles.scopeItem}>
                          <GlobalSkillsItem
                            count={globalSkills.length}
                            onDeploy={handleDeployAllGlobalSkills}
                          />
                        </div>
                        <div className={styles.projectSection}>
                          <ProjectListContainer onDeployProject={handleDeployProjectSkills} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className={styles.navSection}>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                [styles.navItem, isActive && styles.active].filter(Boolean).join(' ')
              }
            >
              <Gear size={18} />
              <span>Settings</span>
            </NavLink>
          </div>
        </nav>
      </aside>
      <main className={styles.main}>
        <header className={styles.topBar}>
          <div className={styles.searchWrapper}>
            <Input
              placeholder="Search skills..."
              icon={<MagnifyingGlass size={16} />}
              onClick={openSearch}
              readOnly
              style={{ cursor: 'pointer' }}
            />
          </div>
          <div className={styles.topBarActions}>
            <IDESwitcher />
          </div>
          <div className={styles.syncIconWrapper}>
            <ICloudStatus
              status={syncStatus}
              lastSyncTime={lastSyncTime}
              pendingChanges={pendingChanges}
            />
          </div>
        </header>
        <div className={styles.content}>{children ?? <Outlet />}</div>
      </main>
      <SearchOverlay
        onDeploy={handleSearchDeploy}
        onExport={handleSearchExport}
        onCopyPath={handleSearchCopyPath}
        onReveal={handleSearchReveal}
        onDelete={handleSearchDelete}
      />

      <ExportDialog
        isOpen={showExportDialog}
        skills={exportSkills}
        onClose={handleExportClose}
        onExportStart={handleExportStart}
      />

      <BatchDeployTargetDialog
        isOpen={showBatchTargetDialog}
        skills={batchDeploySkills}
        sourceInfo={batchDeploySourceInfo}
        onClose={() => setShowBatchTargetDialog(false)}
        onDeploy={handleBatchDeployTarget}
      />

      <BatchDeployDialog
        isOpen={batchDeployStatus !== 'idle'}
        status={batchDeployStatus}
        progress={batchDeployProgress}
        total={batchDeployTotal}
        currentSkillName={batchDeployCurrentSkill}
        result={batchDeployResult}
        onClose={handleBatchDeployDialogClose}
        onCancel={cancelBatchDeploy}
        onRetryFailed={retryBatchDeployFailed}
      />
    </div>
  );
}