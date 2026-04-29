import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { storageService, type Settings as BackendSettings } from '../services/storageService';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'auto' | 'en' | 'zh-CN';

interface SettingsState {
  theme: Theme;
  language: Language;
  autoUpdateCheck: boolean;
  autoRefreshInterval: number;
  defaultImportCategory: string | undefined;
  _initialized: boolean;
}

interface SettingsActions {
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setAutoUpdateCheck: (enabled: boolean) => void;
  setAutoRefreshInterval: (interval: number) => void;
  setDefaultImportCategory: (categoryId: string | undefined) => void;
  initializeFromBackend: () => Promise<void>;
}

export type SettingsStore = SettingsState & SettingsActions;

/**
 * Helper to build backend settings object, handling optional properties correctly
 */
function buildBackendSettings(
  theme: Theme,
  language: Language,
  autoUpdateCheck: boolean,
  autoRefreshInterval: number,
  defaultImportCategory: string | undefined
): BackendSettings {
  const settings: BackendSettings = {
    theme,
    language,
    autoUpdateCheck,
    autoRefreshInterval,
  };
  // Only include defaultImportCategory if it has a value
  if (defaultImportCategory !== undefined) {
    settings.defaultImportCategory = defaultImportCategory;
  }
  return settings;
}

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set, get) => ({
        theme: 'system',
        language: 'auto',
        autoUpdateCheck: true,
        autoRefreshInterval: 5,
        defaultImportCategory: undefined,
        _initialized: false,

        setTheme: (theme) => {
          set({ theme });
          const state = get();
          storageService.setSettings(
            buildBackendSettings(
              theme,
              state.language,
              state.autoUpdateCheck,
              state.autoRefreshInterval,
              state.defaultImportCategory
            )
          ).catch((error) => {
            console.error('Failed to sync theme with backend:', error);
          });
        },
        setLanguage: (language) => {
          set({ language });
          const state = get();
          storageService.setSettings(
            buildBackendSettings(
              state.theme,
              language,
              state.autoUpdateCheck,
              state.autoRefreshInterval,
              state.defaultImportCategory
            )
          ).catch((error) => {
            console.error('Failed to sync language with backend:', error);
          });
        },
        setAutoUpdateCheck: (autoUpdateCheck) => {
          set({ autoUpdateCheck });
          const state = get();
          storageService.setSettings(
            buildBackendSettings(
              state.theme,
              state.language,
              autoUpdateCheck,
              state.autoRefreshInterval,
              state.defaultImportCategory
            )
          ).catch((error) => {
            console.error('Failed to sync autoUpdateCheck with backend:', error);
          });
        },
        setAutoRefreshInterval: (autoRefreshInterval) => {
          set({ autoRefreshInterval });
          const state = get();
          storageService.setSettings(
            buildBackendSettings(
              state.theme,
              state.language,
              state.autoUpdateCheck,
              autoRefreshInterval,
              state.defaultImportCategory
            )
          ).catch((error) => {
            console.error('Failed to sync autoRefreshInterval with backend:', error);
          });
        },
        setDefaultImportCategory: (defaultImportCategory) => {
          set({ defaultImportCategory });
          const state = get();
          storageService.setSettings(
            buildBackendSettings(
              state.theme,
              state.language,
              state.autoUpdateCheck,
              state.autoRefreshInterval,
              defaultImportCategory
            )
          ).catch((error) => {
            console.error('Failed to sync defaultImportCategory with backend:', error);
          });
        },
        initializeFromBackend: async () => {
          if (get()._initialized) return;
          try {
            const config = await storageService.getConfig();
            set({
              theme: config.settings.theme as Theme,
              language: config.settings.language as Language,
              autoUpdateCheck: config.settings.autoUpdateCheck,
              autoRefreshInterval: config.settings.autoRefreshInterval,
              defaultImportCategory: config.settings.defaultImportCategory,
              _initialized: true,
            });
          } catch (error) {
            console.error('Failed to initialize settings from backend:', error);
          }
        },
      }),
      {
        name: 'settings-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          theme: state.theme,
          language: state.language,
          autoUpdateCheck: state.autoUpdateCheck,
          autoRefreshInterval: state.autoRefreshInterval,
          defaultImportCategory: state.defaultImportCategory,
        }),
      }
    ),
    { name: 'settings-store' }
  )
);
