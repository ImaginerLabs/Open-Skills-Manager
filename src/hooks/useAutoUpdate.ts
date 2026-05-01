import { useState, useCallback, useEffect, useRef } from 'react';
import { getName, getVersion } from '@tauri-apps/api/app';
import {
  checkForUpdate,
  downloadAndInstallUpdate,
  type UpdateInfo,
} from '../services/updateService';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';

export interface UseAutoUpdateResult {
  appName: string;
  currentVersion: string;
  updateInfo: UpdateInfo | null;
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  error: string | null;
  checkForUpdates: () => Promise<void>;
  downloadAndInstall: () => Promise<void>;
}

// Check interval for automatic updates (4 hours)
const AUTO_CHECK_INTERVAL = 4 * 60 * 60 * 1000;

// Minimum time between checks (1 hour) - prevents excessive API calls
const MIN_CHECK_INTERVAL = 1 * 60 * 60 * 1000;

export function useAutoUpdate(): UseAutoUpdateResult {
  const [appName, setAppName] = useState<string>('');
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { autoUpdateCheck } = useSettingsStore();
  const { showToast, showConfirmDialog } = useUIStore();
  const autoCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCheckTimeRef = useRef<number>(0);
  const hasCheckedOnStartup = useRef(false);

  // Get app info on mount
  useEffect(() => {
    getVersion().then(setCurrentVersion).catch(() => setCurrentVersion('Unknown'));
    getName().then(setAppName).catch(() => setAppName('Open Skills Manager'));
  }, []);

  // Core update check logic
  const doCheck = useCallback(async (showSuccessToast: boolean) => {
    try {
      const info = await checkForUpdate();
      setUpdateInfo(info);

      if (info) {
        showToast('info', `发现新版本 ${info.latestVersion}，可在设置页面安装`);
      } else if (showSuccessToast) {
        showToast('success', '当前已是最新版本');
      }

      return info;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '检查更新失败';
      console.error('Update check failed:', e);
      if (showSuccessToast) {
        setError(errorMessage);
        showToast('error', errorMessage);
      }
      return null;
    }
  }, [showToast]);

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
    setIsChecking(true);
    setError(null);
    await doCheck(true);
    setIsChecking(false);
  }, [doCheck]);

  // Download and install update
  const downloadAndInstall = useCallback(async () => {
    if (!updateInfo) {
      showToast('error', '没有可用的更新');
      return;
    }

    showConfirmDialog({
      title: '安装更新',
      message: `即将安装版本 ${updateInfo.latestVersion}。应用将自动重启以完成更新。`,
      confirmText: '安装并重启',
      cancelText: '取消',
      onConfirm: async () => {
        setIsDownloading(true);
        setDownloadProgress(0);
        setError(null);

        try {
          await downloadAndInstallUpdate((progress) => {
            setDownloadProgress(progress);
          });
          // App will restart automatically, no need to update state
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : '下载更新失败';
          setError(errorMessage);
          showToast('error', errorMessage);
          setIsDownloading(false);
          setDownloadProgress(0);
        }
      },
    });
  }, [updateInfo, showToast, showConfirmDialog]);

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
    appName,
    currentVersion,
    updateInfo,
    isChecking,
    isDownloading,
    downloadProgress,
    error,
    checkForUpdates,
    downloadAndInstall,
  };
}