import { useState, useEffect, useCallback } from 'react';
import { Plus } from '@phosphor-icons/react';
import { useLibraryStore, type LibrarySkill, type Deployment } from '../../stores/libraryStore';
import { ImportDialog } from '../../components/features/ImportDialog';
import { ImportProgress } from '../../components/features/ImportProgress';
import { ExportDialog } from '../../components/features/ExportDialog';
import { ExportProgress } from '../../components/features/ExportProgress';
import { DeployDialog } from '../../components/features/DeployDialog';
import { SkillPreviewModal, type SkillPreviewData } from '../../components/features/SkillPreviewModal';
import { libraryService } from '../../services/libraryService';
import { useLibraryFilters } from '../../hooks/useLibraryFilters';
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
    addDeployment,
    setLoading,
    setError,
  } = useLibraryStore();

  const {
    showImportDialog,
    showExportDialog,
    showDeployDialog,
    showExportProgress,
    showImportProgress,
    setImportDialog,
    setExportDialog,
    setDeployDialog,
    setExportProgress,
    setImportProgress,
  } = useLibraryDialogs();

  const { handleExportStart } = useLibraryExport();
  const { handleImportStart, handleImportCancel } = useLibraryImport(
    (show) => setImportProgress(show),
    () => setImportDialog(false)
  );

  const onExportStart = useCallback(
    async (format: Parameters<typeof handleExportStart>[0], skillsToExport: LibrarySkill[]) => {
      setExportDialog(false);
      setExportProgress(true);
      await handleExportStart(format, skillsToExport);
    },
    [handleExportStart, setExportDialog, setExportProgress]
  );

  const [skillMdContent, setSkillMdContent] = useState<string>('');
  const [exportSkills, setExportSkills] = useState<LibrarySkill[]>([]);
  const [deploySkill, setDeploySkill] = useState<LibrarySkill | null>(null);

  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    toggleSortDirection,
    filteredSkills,
  } = useLibraryFilters(skills, selectedCategoryId);

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
      try {
        const result = await libraryService.delete(skillId);
        if (result.success) {
          removeSkill(skillId);
        }
      } catch {
        setError('Failed to delete skill');
      }
    },
    [removeSkill, setError]
  );

  const handleExportSkill = useCallback((skillId: string) => {
    const skill = skills.find((s) => s.id === skillId);
    if (skill) {
      setExportSkills([skill]);
      setExportDialog(true);
    }
  }, [skills, setExportDialog]);

  const handleDeploySkill = useCallback((skill: LibrarySkill) => {
    setDeploySkill(skill);
    setDeployDialog(true);
  }, [setDeployDialog]);

  const handleDeployConfirm = useCallback((skillId: string, deployment: Deployment) => {
    addDeployment(skillId, deployment);
  }, [addDeployment]);

  const handleDeployClose = useCallback(() => {
    setDeployDialog(false);
    setDeploySkill(null);
  }, [setDeployDialog]);

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

  const cardActions = {
    onDelete: handleDeleteSkill,
    onExport: handleExportSkill,
    onDeploy: handleDeploySkill,
  };

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
                date: selectedSkill.updatedAt?.toLocaleDateString() ?? selectedSkill.importedAt.toLocaleDateString(),
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

      <DeployDialog
        open={showDeployDialog}
        skill={deploySkill}
        onClose={handleDeployClose}
        onDeploy={handleDeployConfirm}
      />
    </SkillListLayout>
  );
}
