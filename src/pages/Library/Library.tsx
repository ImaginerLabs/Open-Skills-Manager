import { useState, useEffect, useCallback } from 'react';
import { Plus } from '@phosphor-icons/react';
import { useLibraryStore, type LibrarySkill, type Deployment } from '../../stores/libraryStore';
import { SkillDetail } from '../../components/features/SkillDetail';
import { ImportDialog } from '../../components/features/ImportDialog';
import { ImportProgress } from '../../components/features/ImportProgress';
import { ExportDialog, type ExportFormat } from '../../components/features/ExportDialog';
import { ExportProgress } from '../../components/features/ExportProgress';
import { DeployDialog } from '../../components/features/DeployDialog';
import { libraryService } from '../../services/libraryService';
import { useLibraryFilters } from '../../hooks/useLibraryFilters';
import { useUIStore } from '../../stores/uiStore';
import {
  SkillListLayout,
  SkillListHeader,
  SkillList,
  SkillDetailPanel,
} from '../../components/features/SkillList';
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
    startExport,
    updateExportProgress,
    completeExport,
    setExportError,
    resetExport,
    startImport,
    updateImportProgress,
    completeImport,
    cancelImport,
  } = useLibraryStore();

  const { showToast } = useUIStore();

  const [skillMdContent, setSkillMdContent] = useState<string>('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showImportProgress, setShowImportProgress] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportSkills, setExportSkills] = useState<LibrarySkill[]>([]);
  const [showExportProgress, setShowExportProgress] = useState(false);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
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
      setShowExportDialog(true);
    }
  }, [skills]);

  const handleDeploySkill = useCallback((skill: LibrarySkill) => {
    setDeploySkill(skill);
    setShowDeployDialog(true);
  }, []);

  const handleDeployConfirm = useCallback((skillId: string, deployment: Deployment) => {
    addDeployment(skillId, deployment);
  }, [addDeployment]);

  const handleDeployClose = useCallback(() => {
    setShowDeployDialog(false);
    setDeploySkill(null);
  }, []);

  const handleCloseDetail = useCallback(() => {
    selectSkill(null);
    setSkillMdContent('');
  }, [selectSkill]);

  const handleExportStart = useCallback(async (format: ExportFormat, skillsToExport: LibrarySkill[]) => {
    setShowExportDialog(false);
    setShowExportProgress(true);
    startExport(skillsToExport.length);

    try {
      if (format === 'zip' && skillsToExport.length > 1) {
        const ids = skillsToExport.map((s) => s.id);
        const firstSkill = skillsToExport[0];
        updateExportProgress(1, firstSkill?.name ?? 'Unknown');
        const result = await libraryService.exportBatch(ids, 'skills-export.zip');
        if (result === null) {
          setShowExportProgress(false);
          resetExport();
          return;
        }
        if (!result.success) {
          throw new Error(result.error?.message || 'Export failed');
        }
        const lastSkill = skillsToExport[skillsToExport.length - 1];
        updateExportProgress(skillsToExport.length, lastSkill?.name ?? 'Unknown');
      } else {
        for (let i = 0; i < skillsToExport.length; i++) {
          const skill = skillsToExport[i]!;
          updateExportProgress(i + 1, skill.name);
          const result = await libraryService.export(skill.id, format, skill.name);
          if (result === null) {
            setShowExportProgress(false);
            resetExport();
            return;
          }
          if (!result.success) {
            throw new Error(result.error?.message || 'Export failed');
          }
        }
      }
      completeExport();
      showToast('success', `Exported ${skillsToExport.length} skill${skillsToExport.length !== 1 ? 's' : ''} successfully`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Export failed';
      setExportError(message);
      showToast('error', message);
    }
  }, [startExport, updateExportProgress, completeExport, setExportError, showToast, resetExport]);

  const handleExportClose = useCallback(() => {
    setShowExportDialog(false);
    setExportSkills([]);
  }, []);

  const handleExportProgressClose = useCallback(() => {
    setShowExportProgress(false);
  }, []);

  const handleOpenImport = useCallback(() => {
    setShowImportDialog(true);
  }, []);

  const handleImportClose = useCallback(() => {
    setShowImportDialog(false);
  }, []);

  const handleImportStart = useCallback(async (paths: string[], categoryId?: string, groupId?: string) => {
    setShowImportProgress(true);
    startImport(paths.length);

    let successful = 0;
    let failed = 0;
    const failedItems: Array<{ name: string; error: string; code: string }> = [];

    for (let i = 0; i < paths.length; i++) {
      const currentProgress = useLibraryStore.getState().importProgress;
      if (currentProgress.status === 'cancelled') {
        break;
      }

      const path = paths[i]!;
      const name = path.split('/').pop() || path;
      updateImportProgress(i + 1, name);

      try {
        const result = await libraryService.import({ path, categoryId, groupId });
        if (result.success) {
          successful++;
        } else {
          failed++;
          failedItems.push({
            name,
            error: result.error.message,
            code: result.error.code,
          });
        }
      } catch (e) {
        failed++;
        failedItems.push({
          name,
          error: e instanceof Error ? e.message : 'Import failed',
          code: 'IMPORT_ERROR',
        });
      }
    }

    const finalProgress = useLibraryStore.getState().importProgress;
    const wasCancelled = finalProgress.status === 'cancelled';

    completeImport(successful, failed, wasCancelled ? paths.length - successful - failed : 0, failedItems);

    if (successful > 0) {
      const listResult = await libraryService.list();
      if (listResult.success) {
        setSkills(listResult.data);
      }
    }
  }, [startImport, updateImportProgress, completeImport, setSkills]);

  const handleImportCancel = useCallback(() => {
    cancelImport();
  }, [cancelImport]);

  const handleRetryFailed = useCallback(async (_failedItems: Array<{ name: string; error: string; code: string }>) => {
    setShowImportProgress(false);
    setShowImportDialog(true);
  }, []);

  const handleImportProgressClose = useCallback(() => {
    setShowImportProgress(false);
  }, []);

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
          <button type="button" className={styles.importButton} onClick={handleOpenImport}>
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

      <SkillDetailPanel isOpen={selectedSkill !== null} onClose={handleCloseDetail}>
        {selectedSkill && (
          <SkillDetail
            skill={selectedSkill}
            skillMdContent={skillMdContent}
            onClose={handleCloseDetail}
            onDeploy={handleDeploySkill}
            onExport={handleExportSkill}
          />
        )}
      </SkillDetailPanel>

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
        onExportStart={handleExportStart}
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
