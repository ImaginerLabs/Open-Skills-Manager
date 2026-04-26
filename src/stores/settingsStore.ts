import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'auto' | 'en' | 'zh-CN';

interface SettingsState {
  theme: Theme;
  language: Language;
  autoUpdateCheck: boolean;
  autoRefreshInterval: number;
  defaultImportCategory: string | undefined;
}

interface SettingsActions {
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setAutoUpdateCheck: (enabled: boolean) => void;
  setAutoRefreshInterval: (interval: number) => void;
  setDefaultImportCategory: (categoryId: string | undefined) => void;
}

export type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        theme: 'system',
        language: 'auto',
        autoUpdateCheck: true,
        autoRefreshInterval: 5,
        defaultImportCategory: undefined,

        setTheme: (theme) => set({ theme }),
        setLanguage: (language) => set({ language }),
        setAutoUpdateCheck: (autoUpdateCheck) => set({ autoUpdateCheck }),
        setAutoRefreshInterval: (autoRefreshInterval) => set({ autoRefreshInterval }),
        setDefaultImportCategory: (defaultImportCategory) => set({ defaultImportCategory }),
      }),
      { name: 'settings-store' }
    ),
    { name: 'settings-store' }
  )
);
