import { useCallback, useEffect, useRef } from 'react';
import { getName, getVersion } from '@tauri-apps/api/app';
import {
  checkForUpdate,
  downloadAndInstallUpdate,
  type UpdateInfo,
} from '../services/updateService';
import { useSettingsStore } from '../stores/settingsStore';
import { useUpdateStore } from '../stores/updateStore';
import { useUIStore } from '../stores/uiStore';
import { logService, LOG_MODULES, LOG_CODES } from '../services/logService';

export interface UseAutoUpdateResult {
  checkForUpdates: () => Promise<void>;
  downloadAndInstall: () => Promise<void>;
}

// Check interval for automatic updates (4 hours)
const AUTO_CHECK_INTERVAL = 4 * 60 * 60 * 1000;

// Minimum time between checks (1 hour) - prevents excessive API calls
const MIN_CHECK_INTERVAL = 1 * 60 * 60 * 1000;

export function useAutoUpdate(): UseAutoUpdateResult {
  const { autoUpdateCheck } = useSettingsStore();
  const {
    setAppName,
    setCurrentVersion,
    setUpdateAvailable,
    setChecking,
    setDownloadProgress,
    setDownloading,
    setError,
  } = useUpdateStore();
  const { showToast, showConfirmDialog } = useUIStore();
  const autoCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCheckTimeRef = useRef<number>(0);
  const hasCheckedOnStartup = useRef(false);
  const lastNotifiedVersionRef = useRef<string | null>(null);
  const updateInfoRef = useRef<UpdateInfo | null>(null);

  // Get app info on mount
  useEffect(() => {
    getVersion()
      .then((version) => {
        setCurrentVersion(version);
      })
      .catch(() => setCurrentVersion('Unknown'));
    getName()
      .then((name) => {
        setAppName(name);
      })
      .catch(() => setAppName('Open Skills Manager'));
  }, [setCurrentVersion, setAppName]);

  // Core update check logic
  const doCheck = useCallback(
    async (showSuccessToast: boolean) => {
      try {
        const info = await checkForUpdate();
        updateInfoRef.current = info;

        if (info) {
          setUpdateAvailable(true, info.latestVersion, info.releaseNotes);
          // Only show toast if we haven't already notified about this version
          if (lastNotifiedVersionRef.current !== info.latestVersion) {
            lastNotifiedVersionRef.current = info.latestVersion ?? null;
            showToast('info', `发现新版本 ${info.latestVersion}，可在设置页面安装`);
          }
        } else {
          setUpdateAvailable(false);
          if (showSuccessToast) {
            showToast('success', '当前已是最新版本');
          }
        }

        return info;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '检查更新失败';
        logService.error(LOG_MODULES.UPDATE, LOG_CODES.UPDATE_CHECK_FAILED, 'Update check failed', {
          error: errorMessage,
        });
        if (showSuccessToast) {
          setError(errorMessage);
          showToast('error', errorMessage);
        }
        return null;
      }
    },
    [setUpdateAvailable, showToast, setError]
  );

  // Automatic check with rate limiting
  const performAutoCheck = useCallback(async () => {
    const now = Date.now();
    if (now - lastCheckTimeRef.current < MIN_CHECK_INTERVAL) {
      return null;
    }
    lastCheckTimeRef.current = now;
    return doCheck(false);
  }, [doCheck]);

  // Manual check (always shows feedback, bypasses rate limit)
  const checkForUpdates = useCallback(async () => {
    setChecking(true);
    setError(null);
    await doCheck(true);
    setChecking(false);
  }, [doCheck, setChecking, setError]);

  // Download and install update
  const downloadAndInstall = useCallback(async () => {
    if (!updateInfoRef.current) {
      showToast('error', '没有可用的更新');
      return;
    }

    showConfirmDialog({
      title: '安装更新',
      message: `即将安装版本 ${updateInfoRef.current.latestVersion}。应用将自动重启以完成更新。`,
      confirmText: '安装并重启',
      cancelText: '取消',
      onConfirm: async () => {
        setDownloading(true);
        setDownloadProgress(0);
        setError(null);

        try {
          await downloadAndInstallUpdate((progress) => {
            setDownloadProgress(progress);
          });
          // App will restart automatically, no need to update state
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : '下载更新失败';
          logService.error(
            LOG_MODULES.UPDATE,
            LOG_CODES.UPDATE_DOWNLOAD_FAILED,
            'Update download failed',
            { error: errorMessage }
          );
          setError(errorMessage);
          showToast('error', errorMessage);
          setDownloading(false);
          setDownloadProgress(0);
        }
      },
    });
  }, [showToast, showConfirmDialog, setDownloading, setDownloadProgress, setError]);

  // Automatic update check on startup and periodically
  useEffect(() => {
    if (!autoUpdateCheck) {
      // Clear any existing interval if auto check is disabled
      if (autoCheckRef.current) {
        clearInterval(autoCheckRef.current);
        autoCheckRef.current = null;
      }
      return;
    }

    // Check on startup (once)
    if (!hasCheckedOnStartup.current) {
      hasCheckedOnStartup.current = true;
      setTimeout(() => {
        performAutoCheck();
      }, 5000);
    }

    // Set up periodic check (every 4 hours)
    autoCheckRef.current = setInterval(() => {
      performAutoCheck();
    }, AUTO_CHECK_INTERVAL);

    return () => {
      if (autoCheckRef.current) {
        clearInterval(autoCheckRef.current);
        autoCheckRef.current = null;
      }
    };
  }, [autoUpdateCheck, performAutoCheck]);

  return {
    checkForUpdates,
    downloadAndInstall,
  };
}
