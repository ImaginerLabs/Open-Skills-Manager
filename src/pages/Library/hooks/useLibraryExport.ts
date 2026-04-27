import { useCallback } from 'react';
import { useLibraryStore, type LibrarySkill } from '../../../stores/libraryStore';
import { useUIStore } from '../../../stores/uiStore';
import { libraryService } from '../../../services/libraryService';
import type { ExportFormat } from '../../../components/features/ExportDialog';

interface UseLibraryExportResult {
  handleExportStart: (format: ExportFormat, skillsToExport: LibrarySkill[]) => Promise<void>;
}

export function useLibraryExport(): UseLibraryExportResult {
  const startExport = useLibraryStore((state) => state.startExport);
  const updateExportProgress = useLibraryStore((state) => state.updateExportProgress);
  const completeExport = useLibraryStore((state) => state.completeExport);
  const setExportError = useLibraryStore((state) => state.setExportError);
  const resetExport = useLibraryStore((state) => state.resetExport);
  const showToast = useUIStore((state) => state.showToast);

  const handleExportStart = useCallback(
    async (format: ExportFormat, skillsToExport: LibrarySkill[]) => {
      startExport(skillsToExport.length);

      try {
        if (format === 'zip' && skillsToExport.length > 1) {
          const ids = skillsToExport.map((s) => s.id);
          const firstSkill = skillsToExport[0];
          updateExportProgress(1, firstSkill?.name ?? 'Unknown');
          const result = await libraryService.exportBatch(ids, 'skills-export.zip');
          if (result === null) {
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
              resetExport();
              return;
            }
            if (!result.success) {
              throw new Error(result.error?.message || 'Export failed');
            }
          }
        }
        completeExport();
        showToast(
          'success',
          `Exported ${skillsToExport.length} skill${skillsToExport.length !== 1 ? 's' : ''} successfully`
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Export failed';
        setExportError(message);
        showToast('error', message);
      }
    },
    [startExport, updateExportProgress, completeExport, setExportError, showToast, resetExport]
  );

  return { handleExportStart };
}
