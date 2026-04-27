import { useState, useCallback, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Globe,
  Gear,
  MagnifyingGlass,
  CaretRight,
  CaretDown,
} from '@phosphor-icons/react';
import { CategoryManager, ALL_CATEGORY_ID } from '../../features/CategoryManager';
import { ProjectListContainer } from '../Sidebar/ProjectListContainer';
import { ICloudStatus } from '../TopBar/ICloudStatus';
import { useLibraryStore } from '../../../stores/libraryStore';
import { useUIStore } from '../../../stores/uiStore';
import { useCategoryManager } from '../../../hooks/useCategoryManager';
import { useIcloudSync } from '../../../hooks/useIcloudSync';
import { libraryService } from '../../../services/libraryService';
import styles from './MainLayout.module.scss';
import { Input } from '../../ui';

export interface MainLayoutProps {
  children?: React.ReactNode;
}

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

  const { categories, updateSkill, selectedCategoryId, selectedGroupId, selectCategory, selectGroup, skills } = useLibraryStore();
  const { showToast } = useUIStore();
  const dragTargetRef = useRef<HTMLDivElement>(null);
  const categoryManager = useCategoryManager();
  const { status: syncStatus, lastSyncTime, pendingChanges } = useIcloudSync();

  // Set default selection to "All" category on mount
  useEffect(() => {
    if (!selectedCategoryId) {
      selectCategory(ALL_CATEGORY_ID);
    }
  }, [selectedCategoryId, selectCategory]);

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

  const handleSelectCategory = useCallback((categoryId: string) => {
    selectCategory(categoryId);
    // Navigate to library if not already there
    if (!location.pathname.startsWith('/library')) {
      navigate('/library');
    }
  }, [selectCategory, location.pathname, navigate]);

  const handleSelectGroup = useCallback((categoryId: string, groupId: string) => {
    selectCategory(categoryId);
    selectGroup(groupId);
    // Navigate to library if not already there
    if (!location.pathname.startsWith('/library')) {
      navigate('/library');
    }
  }, [selectCategory, selectGroup, location.pathname, navigate]);

  const handleCreateCategory = useCallback(
    (name: string) => {
      categoryManager.createCategory(name);
    },
    [categoryManager]
  );

  const handleRenameCategory = useCallback(
    (categoryId: string, newName: string) => {
      categoryManager.renameCategory(categoryId, newName);
    },
    [categoryManager]
  );

  const handleDeleteCategory = useCallback(
    (categoryId: string) => {
      categoryManager.deleteCategory(categoryId).then((success) => {
        if (success && selectedCategoryId === categoryId) {
          selectCategory(undefined);
        }
      });
    },
    [categoryManager, selectedCategoryId, selectCategory]
  );

  const handleCreateGroup = useCallback(
    (categoryId: string, name: string) => {
      categoryManager.createGroup(categoryId, name);
    },
    [categoryManager]
  );

  const handleRenameGroup = useCallback(
    (categoryId: string, groupId: string, newName: string) => {
      categoryManager.renameGroup(categoryId, groupId, newName);
    },
    [categoryManager]
  );

  const handleDeleteGroup = useCallback(
    (categoryId: string, groupId: string) => {
      categoryManager.deleteGroup(categoryId, groupId).then((success) => {
        if (success && selectedGroupId === groupId) {
          selectGroup(undefined);
        }
      });
    },
    [categoryManager, selectedGroupId, selectGroup]
  );

  useEffect(() => {
    categoryManager.loadCategories();
  }, [categoryManager]);

  const handleOrganizeSkill = useCallback(
    async (skillId: string, categoryId: string | null, groupId?: string) => {
      try {
        const result = await libraryService.organize(skillId, categoryId ?? undefined, groupId);
        if (result.success) {
          const updates: Partial<{ categoryId: string; groupId: string }> = {};
          if (categoryId) updates.categoryId = categoryId;
          if (groupId) updates.groupId = groupId;
          updateSkill(skillId, updates);
          const category = categories.find((c) => c.id === categoryId);
          const group = category?.groups.find((g) => g.id === groupId);
          const locationName = group
            ? `${category?.name} / ${group.name}`
            : category?.name ?? 'Uncategorized';
          showToast('success', `Skill moved to ${locationName}`);
          await categoryManager.loadCategories();
        } else {
          showToast('error', result.error.message);
        }
      } catch (e) {
        showToast('error', e instanceof Error ? e.message : 'Failed to organize skill');
      }
    },
    [updateSkill, categories, showToast, categoryManager]
  );

  // Drag-drop handlers for organizing skills
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (styles.dragOver) {
      dragTargetRef.current?.classList.add(styles.dragOver);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    if (styles.dragOver) {
      dragTargetRef.current?.classList.remove(styles.dragOver);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, categoryId?: string, groupId?: string) => {
      e.preventDefault();
      if (styles.dragOver) {
        dragTargetRef.current?.classList.remove(styles.dragOver);
      }

      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      try {
        const { skillId } = JSON.parse(data) as { skillId: string; skillName: string };
        await handleOrganizeSkill(skillId, categoryId ?? null, groupId);
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
                <span className={styles.expandIcon}>
                  {section.expanded ? (
                    <CaretDown size={12} />
                  ) : (
                    <CaretRight size={12} />
                  )}
                </span>
                <span className={styles.navSectionTitle}>{section.title}</span>
              </button>

              {section.expanded && section.id === 'library' && (
                <div
                  ref={dragTargetRef}
                  className={styles.categoryContainer}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e)}
                >
                  <CategoryManager
                    categories={categories}
                    selectedCategoryId={selectedCategoryId}
                    selectedGroupId={selectedGroupId}
                    totalSkillsCount={skills?.length ?? 0}
                    onSelectCategory={handleSelectCategory}
                    onSelectGroup={handleSelectGroup}
                    onCreateCategory={handleCreateCategory}
                    onRenameCategory={handleRenameCategory}
                    onDeleteCategory={handleDeleteCategory}
                    onCreateGroup={handleCreateGroup}
                    onRenameGroup={handleRenameGroup}
                    onDeleteGroup={handleDeleteGroup}
                    onOrganizeSkill={handleOrganizeSkill}
                  />
                </div>
              )}

              {section.expanded && section.id === 'scopes' && (
                <div className={styles.scopeList}>
                  <NavLink
                    to="/global"
                    className={({ isActive }) =>
                      [styles.navItem, isActive && styles.active].filter(Boolean).join(' ')
                    }
                  >
                    <Globe size={18} />
                    <span>Global Skills</span>
                  </NavLink>
                  <div className={styles.projectSection}>
                    <ProjectListContainer />
                  </div>
                </div>
              )}
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
