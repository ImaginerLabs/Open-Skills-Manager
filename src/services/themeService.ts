import { invokeIPC } from './ipcService';
import type { Theme } from '../stores/settingsStore';

export const themeService = {
  get: () => invokeIPC<Theme>('theme_get'),
  set: (theme: Theme) => invokeIPC<void>('theme_set', { theme }),
  detectSystem: () => invokeIPC<'light' | 'dark'>('theme_detect_system'),
};
