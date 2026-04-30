import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from '@/stores/settingsStore';

// Mock storageService
vi.mock('@/services/storageService', () => ({
  storageService: {
    setSettings: vi.fn(() => Promise.resolve()),
    getConfig: vi.fn(() =>
      Promise.resolve({
        settings: {
          theme: 'dark',
          language: 'zh-CN',
          autoUpdateCheck: false,
          autoRefreshInterval: 10,
          defaultImportCategory: 'cat-1',
        },
      })
    ),
  },
}));

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useSettingsStore.getState();

      expect(state.theme).toBe('system');
      expect(state.language).toBe('auto');
      expect(state.autoUpdateCheck).toBe(true);
      expect(state.autoRefreshInterval).toBe(5);
      expect(state.defaultImportCategory).toBeUndefined();
      expect(state._initialized).toBe(false);
    });
  });

  describe('theme settings', () => {
    it('should set theme to light', () => {
      const { setTheme } = useSettingsStore.getState();
      setTheme('light');

      expect(useSettingsStore.getState().theme).toBe('light');
    });

    it('should set theme to dark', () => {
      const { setTheme } = useSettingsStore.getState();
      setTheme('dark');

      expect(useSettingsStore.getState().theme).toBe('dark');
    });

    it('should set theme to system', () => {
      const { setTheme } = useSettingsStore.getState();
      setTheme('dark');
      setTheme('system');

      expect(useSettingsStore.getState().theme).toBe('system');
    });
  });

  describe('language settings', () => {
    it('should set language to en', () => {
      const { setLanguage } = useSettingsStore.getState();
      setLanguage('en');

      expect(useSettingsStore.getState().language).toBe('en');
    });

    it('should set language to zh-CN', () => {
      const { setLanguage } = useSettingsStore.getState();
      setLanguage('zh-CN');

      expect(useSettingsStore.getState().language).toBe('zh-CN');
    });

    it('should set language to auto', () => {
      const { setLanguage } = useSettingsStore.getState();
      setLanguage('en');
      setLanguage('auto');

      expect(useSettingsStore.getState().language).toBe('auto');
    });
  });

  describe('auto update check', () => {
    it('should enable auto update check', () => {
      const { setAutoUpdateCheck } = useSettingsStore.getState();
      setAutoUpdateCheck(true);

      expect(useSettingsStore.getState().autoUpdateCheck).toBe(true);
    });

    it('should disable auto update check', () => {
      const { setAutoUpdateCheck } = useSettingsStore.getState();
      setAutoUpdateCheck(false);

      expect(useSettingsStore.getState().autoUpdateCheck).toBe(false);
    });
  });

  describe('auto refresh interval', () => {
    it('should set auto refresh interval', () => {
      const { setAutoRefreshInterval } = useSettingsStore.getState();
      setAutoRefreshInterval(10);

      expect(useSettingsStore.getState().autoRefreshInterval).toBe(10);
    });

    it('should handle minimum interval', () => {
      const { setAutoRefreshInterval } = useSettingsStore.getState();
      setAutoRefreshInterval(1);

      expect(useSettingsStore.getState().autoRefreshInterval).toBe(1);
    });

    it('should handle large interval', () => {
      const { setAutoRefreshInterval } = useSettingsStore.getState();
      setAutoRefreshInterval(60);

      expect(useSettingsStore.getState().autoRefreshInterval).toBe(60);
    });
  });

  describe('default import category', () => {
    it('should set default import category', () => {
      const { setDefaultImportCategory } = useSettingsStore.getState();
      setDefaultImportCategory('cat-1');

      expect(useSettingsStore.getState().defaultImportCategory).toBe('cat-1');
    });

    it('should clear default import category', () => {
      const { setDefaultImportCategory } = useSettingsStore.getState();
      setDefaultImportCategory('cat-1');
      setDefaultImportCategory(undefined);

      expect(useSettingsStore.getState().defaultImportCategory).toBeUndefined();
    });
  });

  describe('initializeFromBackend', () => {
    it('should initialize from backend config', async () => {
      const { initializeFromBackend } = useSettingsStore.getState();
      await initializeFromBackend();

      const state = useSettingsStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.language).toBe('zh-CN');
      expect(state.autoUpdateCheck).toBe(false);
      expect(state.autoRefreshInterval).toBe(10);
      expect(state.defaultImportCategory).toBe('cat-1');
      expect(state._initialized).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      const { initializeFromBackend } = useSettingsStore.getState();

      // First initialization
      await initializeFromBackend();
      expect(useSettingsStore.getState()._initialized).toBe(true);

      // Reset to different values
      useSettingsStore.setState({ theme: 'light' });

      // Second call should not reinitialize
      await initializeFromBackend();
      expect(useSettingsStore.getState().theme).toBe('light');
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple settings changes', () => {
      const { setTheme, setLanguage, setAutoUpdateCheck, setAutoRefreshInterval } =
        useSettingsStore.getState();

      setTheme('dark');
      setLanguage('zh-CN');
      setAutoUpdateCheck(false);
      setAutoRefreshInterval(15);

      const state = useSettingsStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.language).toBe('zh-CN');
      expect(state.autoUpdateCheck).toBe(false);
      expect(state.autoRefreshInterval).toBe(15);
    });

    it('should handle rapid settings changes', () => {
      const { setTheme } = useSettingsStore.getState();

      setTheme('light');
      setTheme('dark');
      setTheme('system');
      setTheme('light');

      expect(useSettingsStore.getState().theme).toBe('light');
    });
  });
});