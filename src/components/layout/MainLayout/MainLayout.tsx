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
import { useLibraryStore } from '../../../stores/libraryStore';
import { useProjectStore } from '../../../stores/projectStore';
import { useGlobalStore } from '../../../stores/globalStore';
import { useUIStore } from '../../../stores/uiStore';
import { useCategoryManager } from '../../../hooks/useCategoryManager';
import { useIcloudSync } from '../../../hooks/useIcloudSync';
import { libraryService } from '../../../services/libraryService';
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
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const { groups, updateSkill, selectedGroupId, selectedCategoryId, selectGroup, selectCategory, skills } = useLibraryStore();
  const { skills: globalSkills } = useGlobalStore();
  const { showToast } = useUIStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const categoryManager = useCategoryManager();
  const { status: syncStatus, lastSyncTime, pendingChanges } = useIcloudSync();

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

  // Load groups once on mount (empty deps ensures this only runs once)
  useEffect(() => {
    categoryManager.loadGroups();
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.topBarActions}>
            <ICloudStatus
              status={syncStatus}
              lastSyncTime={lastSyncTime}
              pendingChanges={pendingChanges}
            />
          </div>
        </header>
        <div className={styles.content}>{children ?? <Outlet />}</div>
      </main>
    </div>
  );
}