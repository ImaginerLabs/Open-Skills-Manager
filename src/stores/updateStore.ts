import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UpdateState {
  appName: string;
  currentVersion: string;
  updateAvailable: boolean;
  latestVersion: string | null;
  releaseNotes: string | null;
  isChecking: boolean;
  downloadProgress: number;
  isDownloading: boolean;
  isInstalling: boolean;
  error: string | null;
}

interface UpdateActions {
  setAppName: (name: string) => void;
  setCurrentVersion: (version: string) => void;
  setUpdateAvailable: (available: boolean, version?: string, notes?: string) => void;
  setChecking: (checking: boolean) => void;
  setDownloadProgress: (progress: number) => void;
  setDownloading: (downloading: boolean) => void;
  setInstalling: (installing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export type UpdateStore = UpdateState & UpdateActions;

const initialState: UpdateState = {
  appName: '',
  currentVersion: '',
  updateAvailable: false,
  latestVersion: null,
  releaseNotes: null,
  isChecking: false,
  downloadProgress: 0,
  isDownloading: false,
  isInstalling: false,
  error: null,
};

export const useUpdateStore = create<UpdateStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setAppName: (name) => set({ appName: name }),
      setCurrentVersion: (version) => set({ currentVersion: version }),
      setUpdateAvailable: (available, version, notes) =>
        set({
          updateAvailable: available,
          latestVersion: version ?? null,
          releaseNotes: notes ?? null,
        }),
      setChecking: (checking) => set({ isChecking: checking }),
      setDownloadProgress: (progress) => set({ downloadProgress: progress }),
      setDownloading: (downloading) => set({ isDownloading: downloading }),
      setInstalling: (installing) => set({ isInstalling: installing }),
      setError: (error) => set({ error }),
      reset: () => set(initialState),
    }),
    { name: 'update-store' }
  )
);
