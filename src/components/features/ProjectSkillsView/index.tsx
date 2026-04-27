import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowClockwise, FolderOpen } from '@phosphor-icons/react';
import { useProjectStore, type ProjectSkill } from '../../../stores/projectStore';
import { useProjectRefresh } from '../../../hooks/useProjectRefresh';
import { useProjectSkills } from '../../../hooks/useProjectSkills';
import { SkillListLayout, SkillListHeader, SkillList, SkillDetailPanel } from '../SkillList';
import { useSkillSort } from '../SkillList/hooks/useSkillSort';
import { formatDate } from '../../../utils/formatters';
import {
  ProjectSkillCard,
  SkillContextMenu,
  useProjectSkillContextMenu,
} from './ProjectSkillCard';
import { SkillDetailContent } from './SkillDetailContent';
import { SkillDetailHeader } from './SkillDetailHeader';
import { SkillDetailActions } from './SkillDetailActions';
import styles from './ProjectSkillsView.module.scss';

export function ProjectSkillsView(): React.ReactElement {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, selectedProject, projectSkills, selectProject } = useProjectStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<ProjectSkill | null>(null);
  const [skillMdContent, setSkillMdContent] = useState<string>('');

  const {
    showContextMenu,
    contextMenuPos,
    contextSkill,
    handleContextMenu,
    closeContextMenu,
  } = useProjectSkillContextMenu();

  const { isRefreshing, refreshingProjectId, lastRefreshAt, refreshError, refresh } = useProjectRefresh(
    projectId,
    { autoRefresh: true }
  );

  const { loadSkills, getSkill, deleteSkill, pullSkill } = useProjectSkills();

  // Get project info
  const project = useMemo(() => {
    if (!projectId) return null;
    return projects.find((p) => p.id === projectId) ?? selectedProject;
  }, [projectId, projects, selectedProject]);

  // Get skills for this project
  const skills = useMemo(() => {
    if (!projectId) return [];
    return projectSkills.get(projectId) ?? [];
  }, [projectId, projectSkills]);

  // Sort skills
  const { sortedSkills, sortBy, setSortBy, sortDirection, toggleSortDirection } = useSkillSort(skills);

  // Load skills if not loaded
  useEffect(() => {
    if (projectId && skills.length === 0 && !isRefreshing) {
      loadSkills(projectId);
    }
  }, [projectId, skills.length, isRefreshing, loadSkills]);

  // Select project on mount
  useEffect(() => {
    if (project && project.id !== selectedProject?.id) {
      selectProject(project);
    }
  }, [project, selectedProject, selectProject]);

  // Keyboard shortcut for refresh (Cmd+R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        if (projectId) {
          refresh(projectId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [projectId, refresh]);

  const handleSelectSkill = useCallback(
    async (skill: ProjectSkill) => {
      setSelectedSkill(skill);
      if (projectId) {
        const result = await getSkill(projectId, skill.id);
        if (result.success && result.data) {
          setSkillMdContent(result.data.skillMdContent ?? '');
        }
      }
    },
    [projectId, getSkill]
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedSkill(null);
    setSkillMdContent('');
  }, []);

  const handleDeleteSkill = useCallback(
    async (skillId: string) => {
      if (projectId) {
        const success = await deleteSkill(projectId, skillId);
        if (success && selectedSkill?.id === skillId) {
          handleCloseDetail();
        }
      }
    },
    [projectId, deleteSkill, selectedSkill, handleCloseDetail]
  );

  const handlePullSkill = useCallback(
    async (skillId: string) => {
      if (projectId) {
        await pullSkill(projectId, skillId);
      }
    },
    [projectId, pullSkill]
  );

  const handleRefresh = useCallback(() => {
    if (projectId) {
      refresh(projectId);
    }
  }, [projectId, refresh]);

  const handleContextMenuDelete = useCallback(() => {
    closeContextMenu();
    if (contextSkill) {
      handleDeleteSkill(contextSkill.id);
    }
  }, [contextSkill, handleDeleteSkill, closeContextMenu]);

  const handleContextMenuPull = useCallback(() => {
    closeContextMenu();
    if (contextSkill) {
      handlePullSkill(contextSkill.id);
    }
  }, [contextSkill, handlePullSkill, closeContextMenu]);

  // Filter skills by search query
  const filteredSkills = useMemo(() => {
    if (!searchQuery) return sortedSkills;
    const lowerQuery = searchQuery.toLowerCase();
    return sortedSkills.filter(
      (skill) =>
        skill.name.toLowerCase().includes(lowerQuery) ||
        skill.description.toLowerCase().includes(lowerQuery) ||
        skill.folderName.toLowerCase().includes(lowerQuery)
    );
  }, [sortedSkills, searchQuery]);

  const hasSkills = skills.length > 0;

  // Render card for SkillList
  const renderCard = useCallback(
    (skill: ProjectSkill, isSelected: boolean): React.ReactNode => (
      <ProjectSkillCard
        skill={skill}
        isSelected={isSelected}
        onContextMenu={handleContextMenu}
        styles={styles}
      />
    ),
    [handleContextMenu]
  );

  if (!project) {
    return (
      <SkillListLayout className={styles.page}>
        <div className={styles.empty}>
          <FolderOpen size={48} weight="thin" className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>Project not found</h2>
          <p className={styles.emptyText}>The requested project does not exist or has been removed.</p>
        </div>
      </SkillListLayout>
    );
  }

  // Refresh indicator component
  const RefreshIndicator = () => {
    if (isRefreshing && refreshingProjectId === projectId) {
      return (
        <span className={styles.refreshIndicator}>
          Refreshing...
        </span>
      );
    }
    if (lastRefreshAt) {
      return (
        <span className={styles.refreshIndicator}>
          Last refreshed: {formatDate(lastRefreshAt)}
        </span>
      );
    }
    return null;
  };

  return (
    <SkillListLayout className={styles.page}>
      <SkillListHeader
        title={project.name}
        count={skills.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortDirection={sortDirection}
        onToggleSortDirection={toggleSortDirection}
        actions={
          <>
            <RefreshIndicator />
            <button
              type="button"
              className={[styles.refreshButton, isRefreshing && styles.refreshing].filter(Boolean).join(' ')}
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh (Cmd+R)"
            >
              <ArrowClockwise size={16} className={isRefreshing ? styles.spinning : ''} />
            </button>
          </>
        }
      />

      {refreshError && (
        <div className={styles.error}>
          <p>{refreshError}</p>
        </div>
      )}

      <div className={[styles.gridContainer, selectedSkill && styles.withDetail].filter(Boolean).join(' ')}>
        <SkillList
          skills={filteredSkills}
          selectedSkillId={selectedSkill?.id}
          onSelect={handleSelectSkill}
          onGetSkillId={(skill) => skill.id}
          renderCard={renderCard}
          isLoading={isRefreshing && skills.length === 0}
          emptyTitle="No skills in this project"
          emptyText="This project has no skills installed in .claude/skills/"
          hasSkills={hasSkills}
        />
      </div>

      <SkillDetailPanel
        isOpen={selectedSkill !== null}
        onClose={handleCloseDetail}
      >
        {selectedSkill && (
          <>
            <SkillDetailHeader
              skillName={selectedSkill.name}
              onClose={handleCloseDetail}
              styles={styles}
            />
            <div className={styles.detailContent}>
              <SkillDetailContent
                skill={selectedSkill}
                skillMdContent={skillMdContent}
                styles={styles}
              />
            </div>
            <SkillDetailActions
              skill={selectedSkill}
              onDelete={handleDeleteSkill}
              onPull={handlePullSkill}
              styles={styles}
            />
          </>
        )}
      </SkillDetailPanel>

      {showContextMenu && (
        <SkillContextMenu
          isOpen={showContextMenu}
          position={contextMenuPos}
          onDelete={handleContextMenuDelete}
          onPull={handleContextMenuPull}
          styles={styles}
        />
      )}
    </SkillListLayout>
  );
}
