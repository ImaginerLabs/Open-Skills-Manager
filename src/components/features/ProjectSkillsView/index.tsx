import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowClockwise, FolderOpen } from '@phosphor-icons/react';
import { useProjectStore, type ProjectSkill } from '../../../stores/projectStore';
import { useProjectRefresh } from '../../../hooks/useProjectRefresh';
import { useProjectSkills } from '../../../hooks/useProjectSkills';
import { useSidebarData } from '../../../hooks/useSidebarData';
import { SkillListLayout, SkillListHeader, SkillList } from '../SkillList';
import { useSkillSort } from '../SkillList/hooks/useSkillSort';
import { BatchDeployTargetDialog, type DeployTarget } from '../DeploymentTracking';
import { ExportDialog, type ExportableSkill } from '../ExportDialog';
import { useUIStore } from '../../../stores/uiStore';
import { formatDate } from '../../../utils/formatters';
import { toLibrarySkillFormat } from '../../../utils/skillConverters';
import { filterByQuery, isValidQuery } from '../../../utils/search';
import { SkillPreviewModal, type SkillPreviewData } from '../SkillPreviewModal';
import styles from './ProjectSkillsView.module.scss';

export function ProjectSkillsView(): React.ReactElement {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, selectedProject, selectProject } = useProjectStore();
  const { refreshProjects, refreshLibrary } = useSidebarData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<ProjectSkill | null>(null);
  const [skillMdContent, setSkillMdContent] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRefreshTooltip, setShowRefreshTooltip] = useState(false);
  const [showDeployTargetDialog, setShowDeployTargetDialog] = useState(false);
  const [deploySkill, setDeploySkill] = useState<ProjectSkill | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportSkills, setExportSkills] = useState<ExportableSkill[]>([]);
  const refreshButtonRef = useRef<HTMLButtonElement>(null);

  const { isRefreshing, lastRefreshAt, refreshError, refresh } = useProjectRefresh(
    projectId,
    { autoRefresh: true }
  );

  const { skills, loadSkills, getSkill, deleteSkill } = useProjectSkills(projectId);
  const { showToast } = useUIStore();

  // Get project info
  const project = useMemo(() => {
    if (!projectId) return null;
    return projects.find((p) => p.id === projectId) ?? selectedProject;
  }, [projectId, projects, selectedProject]);

  // Sort skills
  const { sortedSkills, sortBy, setSortBy, sortDirection, toggleSortDirection } = useSkillSort(skills);

  // Load skills if not loaded
  useEffect(() => {
    if (projectId && skills.length === 0 && !isRefreshing) {
      loadSkills(projectId);
    }
  }, [projectId, skills.length, isRefreshing, loadSkills]);

  // Select project on mount - only when this view is first mounted
  // This handles direct URL navigation to a project
  useEffect(() => {
    if (project) {
      selectProject(project);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]); // Only re-run if the project ID changes (different project)

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

  const handleOpenSkillModal = useCallback(
    async (skill: ProjectSkill) => {
      setSelectedSkill(skill);
      setIsModalOpen(true);
      if (projectId) {
        const result = await getSkill(projectId, skill.id);
        if (result.success && result.data) {
          setSkillMdContent(result.data.skillMdContent ?? '');
        }
      }
    },
    [projectId, getSkill]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedSkill(null);
    setSkillMdContent('');
  }, []);

  const handleDeleteSkill = useCallback(
    async (skillId: string) => {
      if (projectId) {
        await deleteSkill(projectId, skillId);
        // Refresh sidebar to update counts
        refreshProjects();
      }
    },
    [projectId, deleteSkill, refreshProjects]
  );

  const handleDeploySkill = useCallback(
    (skill: ProjectSkill) => {
      setDeploySkill(skill);
      setShowDeployTargetDialog(true);
    },
    []
  );

  const handleDeployTarget = useCallback(async (target: DeployTarget) => {
    setShowDeployTargetDialog(false);
    if (!deploySkill) return;

    if (target.type === 'library') {
      // Deploy to Library (pull to library)
      const { libraryService } = await import('../../../services/libraryService');
      const result = await libraryService.import({
        path: deploySkill.path,
        groupId: target.groupId,
        categoryId: target.categoryId,
      });
      if (result.success) {
        showToast('success', `Skill "${deploySkill.name}" added to Library`);
        // Refresh sidebar to update Library counts
        refreshLibrary();
      } else {
        showToast('error', `Failed to add to Library: ${result.error.message}`);
      }
    }
  }, [deploySkill, showToast, refreshLibrary]);

  const handleCopyPath = useCallback(async (skillId: string) => {
    const skill = skills.find((s) => s.id === skillId);
    if (skill) {
      try {
        await navigator.clipboard.writeText(skill.path);
        showToast('success', `Copied path: ${skill.path}`);
      } catch {
        showToast('error', 'Failed to copy path');
      }
    }
  }, [skills, showToast]);

  const handleRefresh = useCallback(() => {
    if (projectId) {
      refresh(projectId);
    }
  }, [projectId, refresh]);

  // Filter skills by search query using unified search logic
  const filteredSkills = useMemo(() => {
    if (!searchQuery || !isValidQuery(searchQuery)) return sortedSkills;
    return filterByQuery(sortedSkills, searchQuery);
  }, [sortedSkills, searchQuery]);

  const hasSkills = skills.length > 0;

  const handleExportSkill = useCallback((skill: ProjectSkill) => {
    setExportSkills([{ id: skill.id, name: skill.name, path: skill.path, scope: 'project' }]);
    setShowExportDialog(true);
  }, []);

  const handleExportStart = useCallback(
    async (format: 'zip' | 'folder', skillsToExport: ExportableSkill[]) => {
      setShowExportDialog(false);
      const { libraryService } = await import('../../../services/libraryService');
      for (const s of skillsToExport) {
        const result = await libraryService.exportFromPath(s.path!, s.name, format);
        if (result?.success) {
          showToast('success', `Exported ${s.name}`);
        } else if (result?.error) {
          showToast('error', result.error.message);
        }
      }
    },
    [showToast]
  );

  const handleExportClose = useCallback(() => {
    setShowExportDialog(false);
    setExportSkills([]);
  }, []);

  const cardActions = useMemo(() => ({
    onDelete: handleDeleteSkill,
    onExport: handleExportSkill,
    onDeploy: handleDeploySkill,
    onCopyPath: handleCopyPath,
  }), [handleDeleteSkill, handleExportSkill, handleDeploySkill, handleCopyPath]);

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

  // Render refresh button with tooltip
  const renderRefreshButton = () => {
    const tooltipContent = isRefreshing
      ? 'Refreshing...'
      : lastRefreshAt
        ? `Last refreshed: ${formatDate(lastRefreshAt)}`
        : 'Refresh';

    return (
      <button
        ref={refreshButtonRef}
        type="button"
        className={[styles.refreshButton, isRefreshing && styles.refreshing].filter(Boolean).join(' ')}
        onClick={handleRefresh}
        disabled={isRefreshing}
        onMouseEnter={() => setShowRefreshTooltip(true)}
        onMouseLeave={() => setShowRefreshTooltip(false)}
        aria-label="Refresh skills"
      >
        <ArrowClockwise size={16} className={isRefreshing ? styles.spinning : ''} />
        {showRefreshTooltip && (
          <div className={styles.refreshTooltip} role="tooltip">
            {tooltipContent}
          </div>
        )}
      </button>
    );
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
        actions={renderRefreshButton()}
      />

      {refreshError && (
        <div className={styles.error}>
          <p>{refreshError}</p>
        </div>
      )}

      <div className={styles.gridContainer}>
        <SkillList
          skills={filteredSkills}
          selectedSkillId={undefined}
          onSelect={() => {}}
          onGetSkillId={(skill) => skill.id}
          scope="project"
          actions={cardActions}
          isLoading={isRefreshing && skills.length === 0}
          emptyTitle="No skills in this project"
          emptyText="This project has no skills installed in .claude/skills/"
          hasSkills={hasSkills}
          onSkillClick={handleOpenSkillModal}
        />
      </div>

      <SkillPreviewModal
        skill={
          selectedSkill
            ? ({
                id: selectedSkill.id,
                name: selectedSkill.name,
                description: selectedSkill.description,
                size: selectedSkill.size,
                fileCount: selectedSkill.fileCount,
                date: selectedSkill.installedAt ? formatDate(selectedSkill.installedAt) : undefined,
                sourceLibrarySkillId: selectedSkill.sourceLibrarySkillId,
              } satisfies SkillPreviewData)
            : null
        }
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        skillMdContent={skillMdContent}
        onDelete={handleDeleteSkill}
        onDeploy={(skillId) => {
          const skill = skills.find((s) => s.id === skillId);
          if (skill) handleDeploySkill(skill);
        }}
      />

      <BatchDeployTargetDialog
        isOpen={showDeployTargetDialog}
        skills={deploySkill ? [toLibrarySkillFormat(deploySkill)] : []}
        sourceInfo={{ sourceType: 'project', projectName: project.name }}
        onClose={() => setShowDeployTargetDialog(false)}
        onDeploy={handleDeployTarget}
      />

      <ExportDialog
        isOpen={showExportDialog}
        skills={exportSkills}
        onClose={handleExportClose}
        onExportStart={handleExportStart}
      />
    </SkillListLayout>
  );
}