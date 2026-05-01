import { invoke } from '@tauri-apps/api/core';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion?: string | undefined;
  releaseNotes?: string | undefined;
  downloadProgress?: number | undefined;
  status: UpdateStatus;
}

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error';

export interface UpdateResult {
  success: boolean;
  data?: UpdateInfo;
  error?: { code: string; message: string };
}

/**
 * Check for updates using the Tauri updater plugin directly
 * This is more reliable than going through the IPC layer
 */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const update = await check();

    if (update) {
      return {
        available: true,
        currentVersion: update.currentVersion,
        latestVersion: update.version,
        releaseNotes: update.body ?? undefined,
        downloadProgress: undefined,
        status: 'available',
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to check for updates:', error);
    throw error;
  }
}

/**
 * Download and install an update
 */
export async function downloadAndInstallUpdate(
  onProgress?: (progress: number) => void
): Promise<void> {
  const update = await check();

  if (!update) {
    throw new Error('No update available');
  }

  let downloaded = 0;
  let contentLength = 0;

  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case 'Started':
        contentLength = event.data.contentLength ?? 0;
        break;
      case 'Progress':
        downloaded += event.data.chunkLength;
        if (contentLength > 0 && onProgress) {
          const progress = Math.round((downloaded / contentLength) * 100);
          onProgress(progress);
        }
        break;
      case 'Finished':
        if (onProgress) {
          onProgress(100);
        }
        break;
    }
  });

  // Restart the app to apply the update
  await relaunch();
}

/**
 * Legacy IPC-based update service (kept for compatibility)
 */
export const updateService = {
  check: async (): Promise<UpdateResult> => {
    try {
      const result = await invoke<UpdateResult>('update_check');
      return result;
    } catch (error) {
      return {
        success: false,
        error: { code: 'INVOKE_ERROR', message: String(error) },
      };
    }
  },

  download: async (): Promise<UpdateResult> => {
    try {
      const result = await invoke<UpdateResult>('update_download');
      return result;
    } catch (error) {
      return {
        success: false,
        error: { code: 'INVOKE_ERROR', message: String(error) },
      };
    }
  },

  install: async (): Promise<UpdateResult> => {
    try {
      const result = await invoke<UpdateResult>('update_install');
      return result;
    } catch (error) {
      return {
        success: false,
        error: { code: 'INVOKE_ERROR', message: String(error) },
      };
    }
  },

  getStatus: async (): Promise<UpdateResult> => {
    try {
      const result = await invoke<UpdateResult>('update_get_status');
      return result;
    } catch (error) {
      return {
        success: false,
        error: { code: 'INVOKE_ERROR', message: String(error) },
      };
    }
  },
};
