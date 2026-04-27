import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowClockwise, MagnifyingGlass, FolderOpen, DotsThree } from '@phosphor-icons/react';
import { useProjectStore, type ProjectSkill } from '../../../stores/projectStore';
import { useProjectRefresh } from '../../../hooks/useProjectRefresh';
import { useProjectSkills } from '../../../hooks/useProjectSkills';
import { ProjectSkillCard } from './ProjectSkillCard';
import { ProjectSkillDetail } from './ProjectSkillDetail';
import { RefreshIndicator } from './RefreshIndicator';
import { SkillListSkeleton } from '../../common/Skeletons/SkillListSkeleton';
import styles from './ProjectSkillsView.module.scss';

export function ProjectSkillsView(): React.ReactElement {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, selectedProject, projectSkills, selectProject } = useProjectStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<ProjectSkill | null>(null);
  const [skillMdContent, setSkillMdContent] = useState<string>('');

  const { isRefreshing, refreshingProjectId, lastRefreshAt, refreshError, refresh } = useProjectRefresh(
    projectId,
    { autoRefresh: true }
  );

  const { loadSkills, getSkill, deleteSkill, pullSkill } = useProjectSkills();

  // Get project info
  const project = useMemo(() => {
    if (!projectId) return null;
    return projects.find((p: import('../../../stores/projectStore').Project) => p.id === projectId) ?? selectedProject;
  }, [projectId, projects, selectedProject]);

  // Get skills for this project
  const skills = useMemo(() => {
    if (!projectId) return [];
    return projectSkills.get(projectId) ?? [];
  }, [projectId, projectSkills]);

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

  const filteredSkills = useMemo(() => {
    if (!searchQuery) return skills;
    const lowerQuery = searchQuery.toLowerCase();
    return skills.filter(
      (skill: ProjectSkill) =>
        skill.name.toLowerCase().includes(lowerQuery) ||
        skill.description.toLowerCase().includes(lowerQuery) ||
        skill.folderName.toLowerCase().includes(lowerQuery)
    );
  }, [skills, searchQuery]);

  const isEmpty = filteredSkills.length === 0 && !isRefreshing;
  const hasSkills = skills.length > 0;

  if (!project) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <FolderOpen size={48} weight="thin" className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>Project not found</h2>
          <p className={styles.emptyText}>The requested project does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{project.name}</h1>
          <span className={styles.count}>{skills.length} skills</span>
          <RefreshIndicator
            isRefreshing={isRefreshing && refreshingProjectId === projectId}
            lastRefreshAt={lastRefreshAt}
            error={refreshError}
          />
        </div>
        <div className={styles.actions}>
          <div className={styles.searchWrapper}>
            <MagnifyingGlass size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Filter skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button
            type="button"
            className={[styles.refreshButton, isRefreshing && styles.refreshing].filter(Boolean).join(' ')}
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh (Cmd+R)"
          >
            <ArrowClockwise size={16} className={isRefreshing ? styles.spinning : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            type="button"
            className={styles.menuButton}
            title="More options"
          >
            <DotsThree size={16} weight="bold" />
          </button>
        </div>
      </header>

      {refreshError && (
        <div className={styles.error}>
          <p>{refreshError}</p>
        </div>
      )}

      <div className={[styles.gridContainer, selectedSkill && styles.withDetail].filter(Boolean).join(' ')}>
        {isRefreshing && skills.length === 0 ? (
          <SkillListSkeleton count={8} />
        ) : isEmpty ? (
          <div className={styles.empty}>
            <FolderOpen size={48} weight="thin" className={styles.emptyIcon} />
            {hasSkills ? (
              <>
                <h2 className={styles.emptyTitle}>No matching skills</h2>
                <p className={styles.emptyText}>Try adjusting your search query.</p>
              </>
            ) : (
              <>
                <h2 className={styles.emptyTitle}>No skills in this project</h2>
                <p className={styles.emptyText}>This project has no skills installed in .claude/skills/</p>
              </>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredSkills.map((skill: ProjectSkill, index: number) => (
              <ProjectSkillCard
                key={skill.id}
                skill={skill}
                isSelected={selectedSkill?.id === skill.id}
                onSelect={handleSelectSkill}
                onDelete={handleDeleteSkill}
                onPull={handlePullSkill}
                style={{ animationDelay: `${index * 50}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      {selectedSkill && (
        <ProjectSkillDetail
          skill={selectedSkill}
          skillMdContent={skillMdContent}
          onClose={handleCloseDetail}
          onDelete={() => handleDeleteSkill(selectedSkill.id)}
          onPull={() => handlePullSkill(selectedSkill.id)}
        />
      )}
    </div>
  );
}