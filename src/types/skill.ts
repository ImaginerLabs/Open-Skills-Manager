// Core skill types shared across all stores

export interface LibrarySkill {
  id: string;
  name: string;
  folderName: string;
  version: string;
  description: string;
  path: string;
  skillMdPath: string;
  skillMdContent?: string;
  skillMdLines: number;
  skillMdChars: number;
  groupId?: string;
  categoryId?: string;
  importedAt: Date;
  updatedAt?: Date;
  size: number;
  fileCount: number;
  hasResources: boolean;
  deployments: Deployment[];
  isSymlink: boolean;
}

export interface GlobalSkill {
  id: string;
  name: string;
  folderName: string;
  version: string;
  description: string;
  path: string;
  skillMdPath: string;
  skillMdContent?: string;
  skillMdLines: number;
  skillMdChars: number;
  installedAt?: Date;
  size: number;
  fileCount: number;
  hasResources: boolean;
  sourceLibrarySkillId?: string;
  isSymlink: boolean;
}

export interface Deployment {
  id: string;
  skillId: string;
  targetScope: 'global' | 'project';
  targetPath: string;
  projectName?: string | undefined;
  deployedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  notes?: string;
  categories: Category[];
  skillCount: number;
  isCustom: boolean;
  createdAt: Date;
}

export interface Category {
  id: string;
  groupId: string;
  name: string;
  icon?: string;
  notes?: string;
  skillCount: number;
  isCustom: boolean;
  createdAt: Date;
}

export type ImportStatus = 'idle' | 'importing' | 'completed' | 'cancelled' | 'error';
export type ExportStatus = 'idle' | 'exporting' | 'completed' | 'cancelled' | 'error';

export interface ImportProgress {
  current: number;
  total: number;
  currentSkillName: string;
  status: ImportStatus;
  successful: number;
  failed: number;
  skipped: number;
  failedItems: Array<{ name: string; error: string; code: string }>;
}

export interface ExportProgress {
  current: number;
  total: number;
  currentSkillName: string;
  status: ExportStatus;
}
