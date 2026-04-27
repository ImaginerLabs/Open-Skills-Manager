import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Hook that applies theme to the document root element.
 * Handles 'light', 'dark', and 'system' theme modes.
 */
export function useThemeEffect(): void {
  const { theme } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.remove('light');
      } else {
        root.classList.add('light');
      }
    };

    if (theme === 'system') {
      // Listen to system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Apply explicit theme
      applyTheme(theme === 'dark');
      return undefined;
    }
  }, [theme]);
}