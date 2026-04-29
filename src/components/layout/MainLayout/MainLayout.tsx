import { useState, useCallback, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Globe,
  Gear,
  MagnifyingGlass,
  CaretRight,
} from '@phosphor-icons/react';
import { CategoryManager, ALL_GROUP_ID } from '../../features/CategoryManager';
import { ProjectListContainer } from '../Sidebar/ProjectListContainer';
import { ICloudStatus } from '../TopBar/ICloudStatus';
import { IDESwitcher } from '../../common/IDESwitcher/IDESwitcher';
import { SearchOverlay } from '../../features/SearchOverlay';
import { DeployDialog } from '../../features/DeployDialog';
import { ExportDialog, type ExportableSkill } from '../../features/ExportDialog';
import { PullToLibraryDialog } from '../../features/GlobalSkillsView/PullToLibraryDialog';
import type { SearchResult } from '../../../stores/uiStore';
import { useLibraryStore, type LibrarySkill, type Deployment } from '../../../stores/libraryStore';
import { useProjectStore } from '../../../stores/projectStore';
import { useGlobalStore, type GlobalSkill } from '../../../stores/globalStore';
import { useUIStore } from '../../../stores/uiStore';
import { useCategoryManager } from '../../../hooks/useCategoryManager';
import { useIcloudSync } from '../../../hooks/useIcloudSync';
import { useSearchKeyboard } from '../../../hooks/useSearchKeyboard';
import { libraryService } from '../../../services/libraryService';
import { globalService } from '../../../services/globalService';
import { configService } from '../../../services/configService';
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
  const navigate = useNavigate();
  const location = useLocation();

  const { groups, updateSkill, selectedGroupId, selectedCategoryId, selectGroup, selectCategory, skills, setSkills } = useLibraryStore();
  const { skills: globalSkills, setSkills: setGlobalSkills } = useGlobalStore();
  const { showToast, showConfirmDialog, closeConfirmDialog } = useUIStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const categoryManager = useCategoryManager();
  const { status: syncStatus, lastSyncTime, pendingChanges } = useIcloudSync();
  const { openSearch } = useSearchKeyboard();

  // Dialog state for search actions
  const [deploySkill, setDeploySkill] = useState<LibrarySkill | null>(null);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [exportSkills, setExportSkills] = useState<ExportableSkill[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [pullSkill, setPullSkill] = useState<GlobalSkill | null>(null);
  const [pullSkillProjectId, setPullSkillProjectId] = useState<string | undefined>(undefined);
  const [showPullDialog, setShowPullDialog] = useState(false);

  // Set default selection to "All" group on initial mount if on library page
  useEffect(() => {
    // Only run once on initial mount
    if (location.pathname.startsWith('/library') && selectedGroupId === undefined) {
      console.log('[useEffect:mount] Setting default All group');
      selectGroup(ALL_GROUP_ID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

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

  const handleSelectGroup = useCallback((groupId: string) => {
    console.log('[handleSelectGroup] Selecting group:', groupId);
    selectGroup(groupId);
    // Clear project selection when selecting a group (mutual exclusivity)
    useProjectStore.getState().selectProject(null);
    // Navigate to library if not already there
    if (!location.pathname.startsWith('/library')) {
      navigate('/library');
    }
  }, [selectGroup, location.pathname, navigate]);

  const handleSelectCategory = useCallback((groupId: string, categoryId: string) => {
    console.log('[handleSelectCategory] Selecting category:', groupId, categoryId);
    selectGroup(groupId);
    selectCategory(categoryId);
    // Clear project selection when selecting a category (mutual exclusivity)
    useProjectStore.getState().selectProject(null);
    // Navigate to library if not already there
    if (!location.pathname.startsWith('/library')) {
      navigate('/library');
    }
  }, [selectGroup, selectCategory, location.pathname, navigate]);

  const handleSelectGlobalSkills = useCallback(() => {
    // Clear library and project selections when selecting Global Skills (mutual exclusivity)
    console.log('[handleSelectGlobalSkills] Clearing selections');
    selectGroup(undefined);
    useProjectStore.getState().selectProject(null);
  }, [selectGroup]);

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
          selectGroup(undefined);
        }
      });
    },
    [categoryManager, selectedGroupId, selectGroup]
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
          selectCategory(undefined);
        }
      });
    },
    [categoryManager, selectedCategoryId, selectCategory]
  );

  // Load groups and global skills once on mount (empty deps ensures this only runs once)
  useEffect(() => {
    categoryManager.loadGroups();

    // Pre-load global skills for sidebar count
    globalService.list().then((result) => {
      if (result.success) {
        setGlobalSkills(result.data);
      }
    });

    // Pre-load library skills for sidebar count
    libraryService.list().then((result) => {
      if (result.success) {
        setSkills(result.data);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          await categoryManager.loadGroups();
        } else {
          showToast('error', result.error.message);
        }
      } catch (e) {
        showToast('error', e instanceof Error ? e.message : 'Failed to organize skill');
      }
    },
    [updateSkill, groups, showToast, categoryManager]
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
      if (result.scope !== 'library') return;
      const res = await libraryService.get(result.id);
      if (res.success && res.data) {
        setDeploySkill(res.data);
        setShowDeployDialog(true);
      } else {
        showToast('error', 'Failed to load skill data');
      }
    },
    [showToast]
  );

  const handleDeployConfirm = useCallback(
    (_skillId: string, _deployment: Deployment) => {
      // Deployment is handled inside DeployDialog
    },
    []
  );

  const handleDeployClose = useCallback(() => {
    setShowDeployDialog(false);
    setDeploySkill(null);
  }, []);

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

  const handleSearchPull = useCallback(
    async (result: SearchResult) => {
      if (result.scope === 'global') {
        const realId = result.id.startsWith('global-')
          ? result.id.slice('global-'.length)
          : result.id;
        const res = await globalService.get(realId);
        if (res.success && res.data) {
          setPullSkill(res.data);
          setPullSkillProjectId(undefined);
          setShowPullDialog(true);
        } else {
          showToast('error', 'Failed to load skill data');
        }
      } else if (result.scope === 'project' && result.projectId) {
        const realId = result.id.startsWith(`pskill-${result.projectId}-`)
          ? result.id.slice(`pskill-${result.projectId}-`.length)
          : result.id;
        try {
          const { projectService } = await import('../../../services/projectService');
          const res = await projectService.getSkill(result.projectId, realId);
          if (res.success && res.data) {
            setPullSkill(res.data as unknown as GlobalSkill);
            setPullSkillProjectId(result.projectId);
            setShowPullDialog(true);
          } else {
            showToast('error', 'Failed to load skill data');
          }
        } catch {
          showToast('error', 'Failed to load skill data');
        }
      }
    },
    [showToast]
  );

  const handlePullComplete = useCallback(() => {
    setShowPullDialog(false);
    setPullSkill(null);
    setPullSkillProjectId(undefined);
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
              const listResult = await libraryService.list();
              if (listResult.success) {
                setSkills(listResult.data);
              }
            } else {
              showToast('error', deleteResult.error.message);
            }
          } else if (result.scope === 'global') {
            const deleteResult = await globalService.delete(result.id);
            if (deleteResult.success) {
              showToast('success', `Deleted ${result.name}`);
              const listResult = await globalService.list();
              if (listResult.success) {
                setGlobalSkills(listResult.data);
              }
            } else {
              showToast('error', deleteResult.error.message);
            }
          }
        },
      });
    },
    [showToast, showConfirmDialog, closeConfirmDialog, setSkills, setGlobalSkills]
  );

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
                      />
                    </div>
                  )}

                  {section.id === 'scopes' && (
                    <div className={styles.scopeList}>
                      <div className={styles.scopeListInner}>
                        <div className={styles.scopeItem}>
                          <NavLink
                            to="/global"
                            draggable={false}
                            onClick={handleSelectGlobalSkills}
                            className={({ isActive }) =>
                              [styles.scopeItemLink, isActive && styles.active].filter(Boolean).join(' ')
                            }
                          >
                            <span className={styles.expandIcon} />
                            <Globe size={16} />
                            <span className={styles.scopeItemName}>Global Skills</span>
                            <span className={styles.count}>{globalSkills.length}</span>
                          </NavLink>
                        </div>
                        <div className={styles.projectSection}>
                          <ProjectListContainer />
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
        onPull={handleSearchPull}
        onCopyPath={handleSearchCopyPath}
        onReveal={handleSearchReveal}
        onDelete={handleSearchDelete}
      />

      <DeployDialog
        open={showDeployDialog}
        skill={deploySkill}
        onClose={handleDeployClose}
        onDeploy={handleDeployConfirm}
      />

      <ExportDialog
        isOpen={showExportDialog}
        skills={exportSkills}
        onClose={handleExportClose}
        onExportStart={handleExportStart}
      />

      <PullToLibraryDialog
        isOpen={showPullDialog}
        skill={pullSkill}
        onClose={handlePullComplete}
        onComplete={handlePullComplete}
        projectId={pullSkillProjectId}
      />
    </div>
  );
}