// IDE related types - single source of truth

import type { Project } from '@/stores/projectStore';

export interface IDEConfig {
  id: string;
  name: string;
  globalScopePath: string;
  projectScopeName: string;
  projects: Project[];
  isEnabled: boolean;
  icon?: string;
}

export interface Settings {
  theme: string;
  language: string;
  autoUpdateCheck: boolean;
  autoRefreshInterval: number;
  defaultImportCategory?: string;
}

export interface AppConfig {
  version: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  settings: Settings;
  syncEnabled: boolean;
  ideConfigs: IDEConfig[];
  activeIdeId: string;
}
