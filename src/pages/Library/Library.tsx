import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Plus, FolderOpen, ArrowDown, MagnifyingGlass } from '@phosphor-icons/react';
import { useLibraryStore, type LibrarySkill } from '../../stores/libraryStore';
import { SkillCard } from '../../components/features/SkillCard';
import { SkillDetail } from '../../components/features/SkillDetail';
import { SkillListSkeleton } from '../../components/common/Skeletons/SkillListSkeleton';
import { ImportDialog } from '../../components/features/ImportDialog';
import { ImportProgress } from '../../components/features/ImportProgress';
import { ExportDialog, type ExportFormat } from '../../components/features/ExportDialog';
import { ExportProgress } from '../../components/features/ExportProgress';
import { libraryService } from '../../services/libraryService';
import { useLibraryFilters } from '../../hooks/useLibraryFilters';
import { useUIStore } from '../../stores/uiStore';
import { SkillCell } from './SkillCell';
import styles from './Library.module.scss';

const CARD_WIDTH = 280;
const CARD_HEIGHT = 160;
const GAP = 16;
const SIDEBAR_WIDTH = 420;

export function Library(): React.ReactElement {
  const {
    skills = [],
    selectedSkill,
    selectedCategoryId,
    isLoading,
    error,
    setSkills,
    selectSkill,
    removeSkill,
    setLoading,
    setError,
    startExport,
    updateExportProgress,
    completeExport,
    setExportError,
    startImport,
    updateImportProgress,
    completeImport,
    cancelImport,
  } = useLibraryStore();

  const { showToast } = useUIStore();

  const [skillMdContent, setSkillMdContent] = useState<string>('');
  const [containerWidth, setContainerWidth] = useState(1200);
  const [containerHeight, setContainerHeight] = useState(800);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showImportProgress, setShowImportProgress] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportSkills, setExportSkills] = useState<LibrarySkill[]>([]);
  const [showExportProgress, setShowExportProgress] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const updateDimensions = () => {
      const el = document.querySelector(`.${styles.gridContainer}`);
      if (el) {
        setContainerWidth(el.clientWidth);
        setContainerHeight(el.clientHeight);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const columnCount = useMemo(() => {
    return Math.max(1, Math.floor((containerWidth + GAP) / (CARD_WIDTH + GAP)));
  }, [containerWidth]);

  const rowCount = useMemo(() => {
    return Math.ceil(filteredSkills.length / columnCount);
  }, [filteredSkills.length, columnCount]);

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
    console.log('Deploy skill:', skill.name);
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
        // Batch export for multiple skills
        const ids = skillsToExport.map((s) => s.id);
        const firstSkill = skillsToExport[0];
        updateExportProgress(1, firstSkill?.name ?? 'Unknown');
        const result = await libraryService.exportBatch(ids, 'skills-export.zip');
        if (result === null) {
          // User cancelled save dialog
          setShowExportProgress(false);
          return;
        }
        if (!result.success) {
          throw new Error(result.error?.message || 'Export failed');
        }
        const lastSkill = skillsToExport[skillsToExport.length - 1];
        updateExportProgress(skillsToExport.length, lastSkill?.name ?? 'Unknown');
      } else {
        // Single export or folder format
        for (let i = 0; i < skillsToExport.length; i++) {
          const skill = skillsToExport[i]!;
          updateExportProgress(i + 1, skill.name);
          const result = await libraryService.export(skill.id, format, skill.name);
          if (result === null) {
            // User cancelled save dialog
            setShowExportProgress(false);
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
  }, [startExport, updateExportProgress, completeExport, setExportError, showToast]);

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

  const handleImportStart = useCallback(async (paths: string[]) => {
    setShowImportProgress(true);
    startImport(paths.length);

    let successful = 0;
    let failed = 0;
    const failedItems: Array<{ name: string; error: string; code: string }> = [];

    for (let i = 0; i < paths.length; i++) {
      // Check for cancellation
      const currentProgress = useLibraryStore.getState().importProgress;
      if (currentProgress.status === 'cancelled') {
        break;
      }

      const path = paths[i]!;
      const name = path.split('/').pop() || path;
      updateImportProgress(i + 1, name);

      try {
        const result = await libraryService.import({ path });
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

    // Check final status to determine how to complete
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
    // Map failed items back to paths (using the name as folder path hint)
    // Note: We need to re-import from the original paths, but we only have names here
    // For retry, we'll need to re-open the import dialog or store original paths
    // For now, we show the import dialog again for the user to select the failed items
    setShowImportProgress(false);
    setShowImportDialog(true);
  }, []);

  const handleImportProgressClose = useCallback(() => {
    setShowImportProgress(false);
  }, []);

  const isEmpty = filteredSkills.length === 0 && !isLoading;
  const hasSkills = skills.length > 0;
  const effectiveWidth = selectedSkill ? containerWidth - SIDEBAR_WIDTH : containerWidth;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Library</h1>
          <span className={styles.count}>{skills.length} skills</span>
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
            className={[styles.sortButton, sortDirection === 'desc' && styles.active].filter(Boolean).join(' ')}
            onClick={toggleSortDirection}
            title={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
          >
            <ArrowDown size={18} />
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size')}
            className={styles.sortSelect}
          >
            <option value="name">Name</option>
            <option value="date">Date</option>
            <option value="size">Size</option>
          </select>
          <button type="button" className={styles.importButton} onClick={handleOpenImport}>
            <Plus size={18} />
            <span>Import</span>
          </button>
        </div>
      </header>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      <div
        ref={containerRef}
        className={[styles.gridContainer, selectedSkill && styles.withDetail].filter(Boolean).join(' ')}
      >
        {isLoading ? (
          <SkillListSkeleton count={12} />
        ) : isEmpty ? (
          <div className={styles.empty}>
            <FolderOpen size={48} weight="thin" className={styles.emptyIcon} />
            {hasSkills ? (
              <>
                <h2 className={styles.emptyTitle}>No matching skills</h2>
                <p className={styles.emptyText}>
                  Try adjusting your search or filters
                </p>
              </>
            ) : (
              <>
                <h2 className={styles.emptyTitle}>Your library is empty</h2>
                <p className={styles.emptyText}>
                  Import skills from folders or zip files to get started
                </p>
                <button type="button" className={styles.importButton} onClick={handleOpenImport}>
                  <Plus size={18} />
                  <span>Import your first skill</span>
                </button>
              </>
            )}
          </div>
        ) : filteredSkills.length > 100 ? (
          <Grid
            columnCount={columnCount}
            columnWidth={CARD_WIDTH + GAP}
            height={containerHeight}
            rowCount={rowCount}
            rowHeight={CARD_HEIGHT + GAP}
            width={effectiveWidth}
          >
            {(props) => (
              <SkillCell
                {...props}
                filteredSkills={filteredSkills}
                columnCount={columnCount}
                selectedSkillId={selectedSkill?.id}
                onSelect={handleSelectSkill}
                onDelete={handleDeleteSkill}
                onExport={handleExportSkill}
                onDeploy={handleDeploySkill}
              />
            )}
          </Grid>
        ) : (
          <div className={styles.grid}>
            {filteredSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                isSelected={selectedSkill?.id === skill.id}
                onSelect={handleSelectSkill}
                onDelete={handleDeleteSkill}
                onExport={handleExportSkill}
                onDeploy={handleDeploySkill}
              />
            ))}
          </div>
        )}
      </div>

      {selectedSkill && (
        <SkillDetail
          skill={selectedSkill}
          skillMdContent={skillMdContent}
          onClose={handleCloseDetail}
          onDeploy={handleDeploySkill}
          onExport={handleExportSkill}
        />
      )}

      <ImportDialog
        isOpen={showImportDialog}
        onClose={handleImportClose}
        onImportStart={handleImportStart}
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

      <ExportProgress
        isOpen={showExportProgress}
        onClose={handleExportProgressClose}
      />
    </div>
  );
}
