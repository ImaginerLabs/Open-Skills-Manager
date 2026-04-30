import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { IDEConfig } from '@/types/ide';

// Re-export for convenience
export type { IDEConfig } from '@/types/ide';

interface IDEState {
  ideConfigs: IDEConfig[];
  activeIdeId: string;
  isLoading: boolean;
  error: string | null;
}

interface IDEActions {
  setIDEConfigs: (configs: IDEConfig[]) => void;
  setActiveIDE: (ideId: string) => void;
  addIDE: (config: IDEConfig) => void;
  removeIDE: (ideId: string) => void;
  updateIDE: (ideId: string, updates: Partial<IDEConfig>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getActiveIDE: () => IDEConfig | undefined;
  reset: () => void;
}

export type IDEStore = IDEState & IDEActions;

const initialState: IDEState = {
  ideConfigs: [],
  activeIdeId: 'claude-code',
  isLoading: false,
  error: null,
};

export const useIDEStore = create<IDEStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setIDEConfigs: (ideConfigs) => set({ ideConfigs }),

      setActiveIDE: (activeIdeId) => set({ activeIdeId }),

      addIDE: (config) => set((state) => ({
        ideConfigs: [...state.ideConfigs, config],
      })),

      removeIDE: (ideId) => set((state) => ({
        ideConfigs: state.ideConfigs.filter((i) => i.id !== ideId),
        activeIdeId: state.activeIdeId === ideId ? 'claude-code' : state.activeIdeId,
      })),

      updateIDE: (ideId, updates) => set((state) => ({
        ideConfigs: state.ideConfigs.map((i) =>
          i.id === ideId ? { ...i, ...updates } : i
        ),
      })),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      getActiveIDE: () => {
        const state = get();
        return state.ideConfigs.find((ide) => ide.id === state.activeIdeId);
      },

      reset: () => set(initialState),
    }),
    { name: 'ide-store' }
  )
);
