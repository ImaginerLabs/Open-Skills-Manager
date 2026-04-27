import type { ImportProgress, ExportProgress } from '@/types/skill';

export const initialImportProgress: ImportProgress = {
  current: 0,
  total: 0,
  currentSkillName: '',
  status: 'idle',
  successful: 0,
  failed: 0,
  skipped: 0,
  failedItems: [],
};

export const initialExportProgress: ExportProgress = {
  current: 0,
  total: 0,
  currentSkillName: '',
  status: 'idle',
};
