import { useCallback, useEffect, useState } from 'react';
import { Gear, PaintBrush, Translate } from '@phosphor-icons/react';
import { getName, getVersion } from '@tauri-apps/api/app';
import { ICloudSettings } from '../../components/features/SettingsPage/ICloudSettings';
import { useIcloudSync } from '../../hooks/useIcloudSync';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import styles from './Settings.module.scss';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(1)} ${units[i]}`;
}

export function Settings(): React.ReactElement {
  const { theme, language, setTheme, setLanguage } = useSettingsStore();
  const { showToast } = useUIStore();
  const [appVersion, setAppVersion] = useState<string>('');
  const [appName, setAppName] = useState<string>('');

  const {
    status,
    lastSyncTime,
    storageUsed,
    storageTotal,
    containerPath,
    isLoading,
    error,
    forceSync,
  } = useIcloudSync();

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => setAppVersion('Unknown'));
    getName().then(setAppName).catch(() => setAppName('Claude Code Skills Manager'));
  }, []);

  const handleForceSync = useCallback(async () => {
    await forceSync();
    if (!error) {
      showToast('success', 'Sync initiated');
    }
  }, [forceSync, error, showToast]);

  const handleViewInFinder = useCallback(async () => {
    if (!containerPath) {
      showToast('error', 'iCloud container path not available');
      return;
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('shell_open', { path: containerPath });
    } catch {
      showToast('error', 'Failed to open Finder');
    }
  }, [containerPath, showToast]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Settings</h1>
          <span className={styles.subtitle}>Manage application preferences</span>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <PaintBrush size={18} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Appearance</h2>
          </header>

          <div className={styles.settingRow}>
            <div className={styles.settingLabel}>
              <span className={styles.settingName}>Theme</span>
              <span className={styles.settingDescription}>Choose the application color scheme</span>
            </div>
            <div className={styles.settingValue}>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                className={styles.select}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <Translate size={18} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Language</h2>
          </header>

          <div className={styles.settingRow}>
            <div className={styles.settingLabel}>
              <span className={styles.settingName}>Interface Language</span>
              <span className={styles.settingDescription}>Select the display language</span>
            </div>
            <div className={styles.settingValue}>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'auto' | 'en' | 'zh-CN')}
                className={styles.select}
              >
                <option value="auto">Auto</option>
                <option value="en">English</option>
                <option value="zh-CN">中文 (简体)</option>
              </select>
            </div>
          </div>
        </section>

        <ICloudSettings
          status={status}
          lastSyncTime={lastSyncTime ?? undefined}
          storageUsed={storageUsed}
          storageTotal={storageTotal}
          containerPath={containerPath}
          isLoading={isLoading}
          error={error}
          onForceSync={handleForceSync}
          onViewInFinder={handleViewInFinder}
        />

        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <Gear size={18} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>About</h2>
          </header>

          <div className={styles.settingRow}>
            <div className={styles.settingLabel}>
              <span className={styles.settingName}>Version</span>
              <span className={styles.settingDescription}>{appName}</span>
            </div>
            <div className={styles.settingValue}>
              <span className={styles.settingName}>{appVersion || '...'}</span>
            </div>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingLabel}>
              <span className={styles.settingName}>Storage Usage</span>
              <span className={styles.settingDescription}>Local storage for skills and settings</span>
            </div>
            <div className={styles.settingValue}>
              <span className={styles.settingName}>{formatBytes(storageUsed)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
