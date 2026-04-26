import { invokeIPC } from './ipcService';
import type { Language } from '../stores/settingsStore';

export const localeService = {
  get: () => invokeIPC<Language>('locale_get'),
  set: (locale: Language) => invokeIPC<void>('locale_set', { locale }),
  detectSystem: () => invokeIPC<Language>('locale_detect_system'),
};
