import { invokeIPC } from './ipcService';
import type { Theme, Language } from '../stores/settingsStore';

export interface AppConfig {
  theme: Theme;
  language: Language;
  autoUpdateCheck: boolean;
  autoRefreshInterval: number;
  defaultImportCategory?: string;
}

export const configService = {
  get: () => invokeIPC<AppConfig>('config_get'),
  set: (config: Partial<AppConfig>) => invokeIPC<void>('config_set', config),
};
