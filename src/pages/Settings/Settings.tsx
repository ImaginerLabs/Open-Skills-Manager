import { useCallback, useEffect, useState } from 'react';
import { ArrowsClockwise, FolderOpen, Gear, PaintBrush, Warning } from '@phosphor-icons/react';
import { getName, getVersion } from '@tauri-apps/api/app';
import { ICloudSettings } from '../../components/features/SettingsPage/ICloudSettings';
import { configService, storageService } from '../../services/configService';
import { useIcloudSync } from '../../hooks/useIcloudSync';
import { useSidebarData } from '../../hooks/useSidebarData';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useAutoUpdate } from '../../hooks/useAutoUpdate';
// Stores imported for getState() access during factory reset
import { useLibraryStore } from '../../stores/libraryStore';
import { useGlobalStore } from '../../stores/globalStore';
import { useProjectStore } from '../../stores/projectStore';
import { useIDEStore } from '../../stores/ideStore';
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
  const { theme, setTheme, setLanguage, autoUpdateCheck, setAutoUpdateCheck } = useSettingsStore();
  const { showToast, showConfirmDialog } = useUIStore();
  const { refreshAll } = useSidebarData();
  const [appVersion, setAppVersion] = useState<string>('');
  const [appName, setAppName] = useState<string>('');

  const {
    status,
    lastSyncTime,
    storageUsed,
    containerPath,
    isLoading,
    error,
    forceSync,
  } = useIcloudSync();

  const {
    currentVersion,
    updateInfo,
    isChecking,
    isDownloading,
    downloadProgress,
    checkForUpdates,
    downloadAndInstall,
  } = useAutoUpdate();

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => setAppVersion('Unknown'));
    getName().then(setAppName).catch(() => setAppName('Claude Code Skills Manager'));
  }, []);

  const handleForceSync = useCallback(async () => {
    try {
      await forceSync();
      showToast('success', 'Sync completed successfully');
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Sync failed');
    }
  }, [forceSync, showToast]);

  const handleViewInFinder = useCallback(async () => {
    if (!containerPath) {
      showToast('error', 'iCloud container path not available');
      return;
    }

    try {
      // First ensure the directory exists
      await storageService.ensureICloudPath();

      // Open the folder directly (enter into it)
      await configService.openPath(containerPath);
      showToast('success', 'Opened iCloud folder in Finder');
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to open Finder');
    }
  }, [containerPath, showToast]);

  const handleOpenDataDir = useCallback(async () => {
    try {
      const path = await configService.getAppDataPath();
      await configService.openPath(path);
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to open data directory');
    }
  }, [showToast]);

  const handleResetToDefaults = useCallback(() => {
    showConfirmDialog({
      title: 'Factory Reset',
      message: 'This will permanently delete ALL your imported skills and reset all settings to defaults. iCloud synced data will also be cleared. This action cannot be undone.',
      confirmText: 'Reset',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          // Reset backend storage (config, library, sync state, iCloud data)
          await storageService.resetToDefaults();

          // Reset all frontend stores
          setTheme('system');
          setLanguage('auto');

          // Clear library store (skills and groups) and selection
          useLibraryStore.getState().setSkills([]);
          useLibraryStore.getState().setGroups([]);
          useLibraryStore.getState().selectGroup(undefined);
          useLibraryStore.getState().selectCategory(undefined);

          // Clear global store
          useGlobalStore.getState().setSkills([]);

          // Clear project store and selection
          useProjectStore.getState().setProjects([]);
          useProjectStore.getState().selectProject(null);

          // Reset IDE store to defaults
          useIDEStore.getState().reset();

          // Refresh sidebar to show empty state
          refreshAll();

          showToast('success', 'All data has been reset to factory defaults');
        } catch (e) {
          showToast('error', e instanceof Error ? e.message : 'Failed to reset settings');
        }
      },
    });
  }, [setTheme, setLanguage, showToast, showConfirmDialog, refreshAll]);

  return (
    <div className={styles.page} data-testid="settings-page">
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

        <ICloudSettings
          status={status}
          lastSyncTime={lastSyncTime ?? undefined}
          containerPath={containerPath}
          isLoading={isLoading}
          error={error}
          onForceSync={handleForceSync}
          onViewInFinder={handleViewInFinder}
        />

        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <ArrowsClockwise size={18} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Updates</h2>
          </header>

          <div className={styles.settingRow}>
            <div className={styles.settingLabel}>
              <span className={styles.settingName}>Auto Check for Updates</span>
              <span className={styles.settingDescription}>Automatically check for updates when the app starts</span>
            </div>
            <div className={styles.settingValue}>
              <select
                value={autoUpdateCheck ? 'true' : 'false'}
                onChange={(e) => setAutoUpdateCheck(e.target.value === 'true')}
                className={styles.select}
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingLabel}>
              <span className={styles.settingName}>Current Version</span>
              <span className={styles.settingDescription}>{appName}</span>
            </div>
            <div className={styles.settingValue}>
              <span className={styles.settingName}>{currentVersion || appVersion || '...'}</span>
            </div>
          </div>

          {updateInfo && (
            <div className={styles.settingRow}>
              <div className={styles.settingLabel}>
                <span className={styles.settingName}>Update Available</span>
                <span className={styles.settingDescription}>
                  Version {updateInfo.latestVersion} is available
                </span>
              </div>
              <div className={styles.settingValue}>
                {isDownloading ? (
                  <span className={styles.settingName}>{downloadProgress}%</span>
                ) : (
                  <button
                    type="button"
                    className={styles.select}
                    onClick={downloadAndInstall}
                    disabled={isDownloading}
                  >
                    Download & Install
                  </button>
                )}
              </div>
            </div>
          )}

          {!updateInfo && (
            <div className={styles.settingRow}>
              <div className={styles.settingLabel}>
                <span className={styles.settingName}>Check for Updates</span>
                <span className={styles.settingDescription}>Manually check for new versions</span>
              </div>
              <div className={styles.settingValue}>
                <button
                  type="button"
                  className={styles.select}
                  onClick={checkForUpdates}
                  disabled={isChecking}
                >
                  {isChecking ? 'Checking...' : 'Check Now'}
                </button>
              </div>
            </div>
          )}
        </section>

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

          <div className={styles.settingRow}>
            <div className={styles.settingLabel}>
              <span className={styles.settingName}>Data Directory</span>
              <span className={styles.settingDescription}>Open application data folder in Finder</span>
            </div>
            <div className={styles.settingValue}>
              <button
                type="button"
                className={styles.select}
                onClick={handleOpenDataDir}
              >
                <FolderOpen size={16} weight="bold" />
                Open in Finder
              </button>
            </div>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingLabel}>
              <span className={styles.settingName}>Factory Reset</span>
              <span className={styles.settingDescription}>Reset all settings to defaults and clear iCloud data</span>
            </div>
            <div className={styles.settingValue}>
              <button
                type="button"
                className={`${styles.select} ${styles.dangerButton}`}
                onClick={handleResetToDefaults}
              >
                <Warning size={16} weight="bold" />
                Reset to Defaults
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
