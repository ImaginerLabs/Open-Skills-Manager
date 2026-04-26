import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface UIState {
  sidebarState: 'expanded' | 'collapsed';
  searchQuery: string;
  activeView: 'library' | 'global' | 'project' | 'settings';
  toasts: Toast[];
  confirmDialog: {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  } | null;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarState: (state: 'expanded' | 'collapsed') => void;
  setSearchQuery: (query: string) => void;
  setActiveView: (view: 'library' | 'global' | 'project' | 'settings') => void;
  showToast: (type: ToastType, message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
  showConfirmDialog: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }) => void;
  closeConfirmDialog: () => void;
}

export type UIStore = UIState & UIActions;

let toastId = 0;

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      sidebarState: 'expanded',
      searchQuery: '',
      activeView: 'library',
      toasts: [],
      confirmDialog: null,

      toggleSidebar: () =>
        set((state) => ({
          sidebarState: state.sidebarState === 'expanded' ? 'collapsed' : 'expanded',
        })),
      setSidebarState: (sidebarState) => set({ sidebarState }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setActiveView: (activeView) => set({ activeView }),

      showToast: (type, message, duration = 3000) => {
        const id = `toast-${++toastId}`;
        set((state) => ({
          toasts: [...state.toasts, { id, type, message, duration }],
        }));
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        }, duration);
      },

      dismissToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      showConfirmDialog: (options) =>
        set({ confirmDialog: { ...options, open: true } }),

      closeConfirmDialog: () =>
        set((state) =>
          state.confirmDialog ? { confirmDialog: { ...state.confirmDialog, open: false } } : state
        ),
    }),
    { name: 'ui-store' }
  )
);
