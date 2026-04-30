import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus } from '@phosphor-icons/react';
import { useLibraryStore, type LibrarySkill } from '../../stores/libraryStore';
import { useUIStore } from '../../stores/uiStore';
import { ImportDialog } from '../../components/features/ImportDialog';
import { ImportProgress } from '../../components/features/ImportProgress';
import { ExportDialog, type ExportableSkill } from '../../components/features/ExportDialog';
import { ExportProgress } from '../../components/features/ExportProgress';
import { BatchDeployTargetDialog, BatchDeployDialog, type DeployTarget } from '../../components/features/DeploymentTracking';
import { SkillPreviewModal, type SkillPreviewData } from '../../components/features/SkillPreviewModal';
import { libraryService } from '../../services/libraryService';
import { configService } from '../../services/configService';
import { useLibraryFilters } from '../../hooks/useLibraryFilters';
import { useBatchDeploy } from '../../hooks/useBatchDeploy';
import { useSidebarData } from '../../hooks/useSidebarData';
import { normalizeSkillDate } from '../../utils/formatters';
import {
  SkillListLayout,
  SkillListHeader,
  SkillList,
} from '../../components/features/SkillList';
import { useLibraryDialogs } from './hooks/useLibraryDialogs';
import { useLibraryExport } from './hooks/useLibraryExport';
import { useLibraryImport } from './hooks/useLibraryImport';
import styles from './Library.module.scss';

export function Library(): React.ReactElement {
  const {
    skills = [],
    selectedSkill,
    selectedCategoryId,
    selectedGroupId,
    isLoading,
    error,
    setSkills,
    selectSkill,
    removeSkill,
    setLoading,
    setError,
  } = useLibraryStore();

  const {
    showToast,
    showConfirmDialog,
    closeConfirmDialog,
  } = useUIStore();

  const { refreshLibrary } = useSidebarData();

  const {
    showImportDialog,
    showExportDialog,
    showExportProgress,
    showImportProgress,
    setImportDialog,
    setExportDialog,
    setExportProgress,
    setImportProgress,
  } = useLibraryDialogs();

  const { handleExportStart } = useLibraryExport();
  const { handleImportStart, handleImportCancel } = useLibraryImport(
    (show) => setImportProgress(show),
    () => {
      setImportDialog(false);
      // Refresh sidebar after import completes
      refreshLibrary();
    }
  );

  const {
    status: deployStatus,
    progress: deployProgress,
    total: deployTotal,
    currentSkillName: deployCurrentSkill,
    result: deployResult,
    startDeploy,
    cancel: cancelDeploy,
    reset: resetDeploy,
    retryFailed: retryDeployFailed,
  } = useBatchDeploy();

  const onExportStart = useCallback(
    async (format: Parameters<typeof handleExportStart>[0], skillsToExport: ExportableSkill[]) => {
      setExportDialog(false);
      setExportProgress(true);
      await handleExportStart(format, skillsToExport);
    },
    [handleExportStart, setExportDialog, setExportProgress]
  );

  const [skillMdContent, setSkillMdContent] = useState<string>('');
  const [exportSkills, setExportSkills] = useState<ExportableSkill[]>([]);
  const [showDeployTargetDialog, setShowDeployTargetDialog] = useState(false);
  const [deploySkills, setDeploySkills] = useState<LibrarySkill[]>([]);

  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    toggleSortDirection,
    filteredSkills,
  } = useLibraryFilters(skills, selectedGroupId, selectedCategoryId);

  useEffect(() => {
    const loadSkills = async () => {
      setLoading(true);
      try {
        const result = await libraryService.list();
        if (result.success) {
          setSkills(result.data);
        } else {
          setError(result.error.message);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load skills');
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, [setSkills, setLoading, setError]);

  const handleSelectSkill = useCallback(
    async (skill: LibrarySkill) => {
      selectSkill(skill);
      try {
        const result = await libraryService.get(skill.id);
        if (result.success && result.data) {
          setSkillMdContent(result.data.skillMdContent || '');
        }
      } catch {
        setSkillMdContent('');
      }
    },
    [selectSkill]
  );

  const handleDeleteSkill = useCallback(
    async (skillId: string) => {
      const skill = skills.find((s) => s.id === skillId);
      showConfirmDialog({
        title: 'Delete Library Skill',
        message: `Are you sure you want to delete "${skill?.name ?? 'this skill'}"? This will remove the skill from your library. This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: async () => {
          closeConfirmDialog();
          setLoading(true);
          try {
            const result = await libraryService.delete(skillId);
            if (result.success) {
              removeSkill(skillId);
              // Deselect if the deleted skill was selected
              if (selectedSkill?.id === skillId) {
                selectSkill(null);
                setSkillMdContent('');
              }
              showToast('success', 'Skill deleted from library');
              // Refresh sidebar to update counts
              refreshLibrary();
            } else {
              setError(result.error.message);
              showToast('error', `Failed to delete: ${result.error.message}`);
            }
          } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            setError(message);
            showToast('error', `Failed to delete: ${message}`);
          } finally {
            setLoading(false);
          }
        },
      });
    },
    [skills, selectedSkill, removeSkill, selectSkill, setLoading, setError, showToast, showConfirmDialog, closeConfirmDialog, refreshLibrary]
  );

  const handleExportSkill = useCallback((skill: LibrarySkill) => {
    setExportSkills([skill]);
    setExportDialog(true);
  }, [setExportDialog]);

  const handleDeploySkill = useCallback((skill: LibrarySkill) => {
    setDeploySkills([skill]);
    setShowDeployTargetDialog(true);
  }, []);

  const handleDeployTarget = useCallback(async (target: DeployTarget) => {
    setShowDeployTargetDialog(false);
    if (deploySkills.length === 0) return;

    if (target.type === 'library') {
      // Copy within library - update skill metadata (organize)
      for (const skill of deploySkills) {
        const result = await libraryService.organize(skill.id, target.groupId, target.categoryId);
        if (result.success) {
          showToast('success', `Skill "${skill.name}" moved to new location`);
        } else {
          showToast('error', `Failed to move "${skill.name}": ${result.error.message}`);
        }
      }
      // Refresh sidebar to update counts
      refreshLibrary();
    } else if (target.type === 'global') {
      startDeploy(deploySkills, {
        targetScope: 'global',
        ...(target.ideId ? { targetIdeId: target.ideId } : {}),
        sourceScope: 'library',
      });
    } else if (target.type === 'project' && target.projectId) {
      startDeploy(deploySkills, {
        targetScope: 'project',
        projectId: target.projectId,
        sourceScope: 'library',
      });
    }
  }, [deploySkills, startDeploy, showToast, refreshLibrary]);

  const handleDeployDialogClose = useCallback(() => {
    resetDeploy();
    setDeploySkills([]);
  }, [resetDeploy]);

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

  const handleReveal = useCallback(async (skillId: string) => {
    const skill = skills.find((s) => s.id === skillId);
    if (skill) {
      try {
        await configService.revealPath(skill.path);
      } catch {
        showToast('error', 'Failed to reveal in Finder');
      }
    }
  }, [skills, showToast]);

  const handleCloseDetail = useCallback(() => {
    selectSkill(null);
    setSkillMdContent('');
  }, [selectSkill]);

  const handleExportClose = useCallback(() => {
    setExportDialog(false);
    setExportSkills([]);
  }, [setExportDialog]);

  const handleExportProgressClose = useCallback(() => {
    setExportProgress(false);
  }, [setExportProgress]);

  const handleImportClose = useCallback(() => {
    setImportDialog(false);
  }, [setImportDialog]);

  const handleRetryFailed = useCallback(async (_failedItems: Array<{ name: string; error: string; code: string }>) => {
    setImportProgress(false);
    setImportDialog(true);
  }, [setImportProgress, setImportDialog]);

  const handleImportProgressClose = useCallback(() => {
    setImportProgress(false);
  }, [setImportProgress]);

  const cardActions = useMemo(() => ({
    onDelete: handleDeleteSkill,
    onExport: handleExportSkill,
    onDeploy: handleDeploySkill,
    onCopyPath: handleCopyPath,
    onReveal: handleReveal,
  }), [handleDeleteSkill, handleExportSkill, handleDeploySkill, handleCopyPath, handleReveal]);

  const hasSkills = skills.length > 0;

  return (
    <SkillListLayout className={styles.page}>
      <SkillListHeader
        title="Library"
        count={skills.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortDirection={sortDirection}
        onToggleSortDirection={toggleSortDirection}
        actions={
          <button type="button" className={styles.importButton} onClick={() => setImportDialog(true)}>
            <Plus size={18} />
            <span>Import</span>
          </button>
        }
      />

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      <div className={styles.listContainer}>
        <SkillList
          skills={filteredSkills}
          selectedSkillId={selectedSkill?.id}
          onSelect={handleSelectSkill}
          onGetSkillId={(skill) => skill.id}
          scope="library"
          actions={cardActions}
          isLoading={isLoading}
          emptyTitle="Your library is empty"
          emptyText="Import skills from folders or zip files to get started"
          hasSkills={hasSkills}
          searchQuery={searchQuery}
        />
      </div>

      <SkillPreviewModal
        isOpen={selectedSkill !== null}
        onClose={handleCloseDetail}
        skill={
          selectedSkill
            ? ({
                id: selectedSkill.id,
                name: selectedSkill.name,
                description: selectedSkill.description,
                size: selectedSkill.size,
                fileCount: selectedSkill.fileCount,
                date: normalizeSkillDate(selectedSkill.updatedAt, selectedSkill.importedAt),
              } satisfies SkillPreviewData)
            : null
        }
        skillMdContent={skillMdContent}
      />

      <ImportDialog
        isOpen={showImportDialog}
        onClose={handleImportClose}
        onImportStart={handleImportStart}
        selectedCategoryId={selectedCategoryId}
        selectedGroupId={selectedGroupId}
      />

      <ImportProgress
        isOpen={showImportProgress}
        onCancel={handleImportCancel}
        onRetry={handleRetryFailed}
        onClose={handleImportProgressClose}
      />

      <ExportDialog
        isOpen={showExportDialog}
        skills={exportSkills}
        onClose={handleExportClose}
        onExportStart={onExportStart}
      />

      <ExportProgress isOpen={showExportProgress} onClose={handleExportProgressClose} />

      <BatchDeployTargetDialog
        isOpen={showDeployTargetDialog}
        skills={deploySkills}
        sourceInfo={{ sourceType: 'library', groupId: selectedGroupId, categoryId: selectedCategoryId }}
        onClose={() => setShowDeployTargetDialog(false)}
        onDeploy={handleDeployTarget}
      />

      <BatchDeployDialog
        isOpen={deployStatus !== 'idle'}
        status={deployStatus}
        progress={deployProgress}
        total={deployTotal}
        currentSkillName={deployCurrentSkill}
        result={deployResult}
        onClose={handleDeployDialogClose}
        onCancel={cancelDeploy}
        onRetryFailed={retryDeployFailed}
      />
    </SkillListLayout>
  );
}
