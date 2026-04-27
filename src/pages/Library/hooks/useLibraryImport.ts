import { useCallback } from 'react';
import { useLibraryStore } from '../../../stores/libraryStore';
import { libraryService } from '../../../services/libraryService';

interface UseLibraryImportResult {
  handleImportStart: (paths: string[], categoryId?: string, groupId?: string) => Promise<void>;
  handleImportCancel: () => void;
}

export function useLibraryImport(
  setShowImportProgress: (show: boolean) => void,
  onSuccess?: () => void
): UseLibraryImportResult {
  const { startImport, updateImportProgress, completeImport, cancelImport, setSkills } = useLibraryStore();

  const handleImportStart = useCallback(
    async (paths: string[], categoryId?: string, groupId?: string) => {
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
          onSuccess?.();
        }
      }
    },
    [startImport, updateImportProgress, completeImport, setSkills, setShowImportProgress, onSuccess]
  );

  const handleImportCancel = useCallback(() => {
    cancelImport();
  }, [cancelImport]);

  return { handleImportStart, handleImportCancel };
}
