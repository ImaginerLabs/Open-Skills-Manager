import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UpdateState {
  updateAvailable: boolean;
  latestVersion: string | null;
  releaseNotes: string | null;
  downloadProgress: number;
  isDownloading: boolean;
  isInstalling: boolean;
  error: string | null;
}

interface UpdateActions {
  setUpdateAvailable: (available: boolean, version?: string, notes?: string) => void;
  setDownloadProgress: (progress: number) => void;
  setDownloading: (downloading: boolean) => void;
  setInstalling: (installing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export type UpdateStore = UpdateState & UpdateActions;

const initialState: UpdateState = {
  updateAvailable: false,
  latestVersion: null,
  releaseNotes: null,
  downloadProgress: 0,
  isDownloading: false,
  isInstalling: false,
  error: null,
};

export const useUpdateStore = create<UpdateStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setUpdateAvailable: (available, version, notes) =>
        set({
          updateAvailable: available,
          latestVersion: version ?? null,
          releaseNotes: notes ?? null,
        }),
      setDownloadProgress: (progress) => set({ downloadProgress: progress }),
      setDownloading: (downloading) => set({ isDownloading: downloading }),
      setInstalling: (installing) => set({ isInstalling: installing }),
      setError: (error) => set({ error }),
      reset: () => set(initialState),
    }),
    { name: 'update-store' }
  )
);
