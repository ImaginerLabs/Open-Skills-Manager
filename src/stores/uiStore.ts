import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export type SearchScope = 'all' | 'library' | 'global' | 'project';

export interface SearchResult {
  id: string;
  name: string;
  description: string;
  scope: 'library' | 'global' | 'project';
  path: string;
  size: number;
  fileCount: number;
  matchedSnippet?: string;
  projectId?: string;
  categoryId?: string;
}

export interface GroupedSearchResults {
  library: SearchResult[];
  global: SearchResult[];
  projects: Record<string, SearchResult[]>;
}

interface SearchUIState {
  isSearchOpen: boolean;
  searchQuery: string;
  searchScope: SearchScope;
  selectedProjectId: string | null;
  selectedCategoryId: string | null;
  searchResults: GroupedSearchResults | null;
  isSearching: boolean;
  collapsedGroups: Record<string, boolean>;
}

export type ViewMode = 'grid' | 'list';

interface UIState {
  sidebarState: 'expanded' | 'collapsed';
  activeView: 'library' | 'global' | 'project' | 'settings';
  viewMode: ViewMode;
  toasts: Toast[];
  confirmDialog: {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  } | null;
  search: SearchUIState;
}

interface SearchUIActions {
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
  setSearchScope: (scope: SearchScope) => void;
  setSelectedProjectId: (projectId: string | null) => void;
  setSelectedCategoryId: (categoryId: string | null) => void;
  setSearchResults: (results: GroupedSearchResults | null) => void;
  setSearching: (searching: boolean) => void;
  toggleGroupCollapse: (groupId: string) => void;
  resetSearch: () => void;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarState: (state: 'expanded' | 'collapsed') => void;
  setActiveView: (view: 'library' | 'global' | 'project' | 'settings') => void;
  setViewMode: (mode: ViewMode) => void;
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
  searchActions: SearchUIActions;
}

export type UIStore = UIState & UIActions;

let toastId = 0;

const initialSearchState: SearchUIState = {
  isSearchOpen: false,
  searchQuery: '',
  searchScope: 'all',
  selectedProjectId: null,
  selectedCategoryId: null,
  searchResults: null,
  isSearching: false,
  collapsedGroups: {},
};

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set) => ({
        sidebarState: 'expanded',
        activeView: 'library',
        viewMode: 'list',
        toasts: [],
        confirmDialog: null,
        search: initialSearchState,

        toggleSidebar: () =>
          set((state) => ({
            sidebarState: state.sidebarState === 'expanded' ? 'collapsed' : 'expanded',
          })),
        setSidebarState: (sidebarState) => set({ sidebarState }),
        setActiveView: (activeView) => set({ activeView }),
        setViewMode: (viewMode) => set({ viewMode }),

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

        searchActions: {
          openSearch: () => set((state) => ({ search: { ...state.search, isSearchOpen: true } })),
          closeSearch: () => set((state) => ({ search: { ...state.search, isSearchOpen: false } })),
          setSearchQuery: (query) => set((state) => ({ search: { ...state.search, searchQuery: query } })),
          setSearchScope: (scope) => set((state) => ({ search: { ...state.search, searchScope: scope } })),
          setSelectedProjectId: (projectId) => set((state) => ({ search: { ...state.search, selectedProjectId: projectId } })),
          setSelectedCategoryId: (categoryId) => set((state) => ({ search: { ...state.search, selectedCategoryId: categoryId } })),
          setSearchResults: (results) => set((state) => ({ search: { ...state.search, searchResults: results } })),
          setSearching: (searching) => set((state) => ({ search: { ...state.search, isSearching: searching } })),
          toggleGroupCollapse: (groupId) => set((state) => ({
            search: {
              ...state.search,
              collapsedGroups: {
                ...state.search.collapsedGroups,
                [groupId]: !state.search.collapsedGroups[groupId],
              },
            },
          })),
          resetSearch: () => set({ search: initialSearchState }),
        },
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          viewMode: state.viewMode,
        }),
      }
    ),
    { name: 'ui-store' }
  )
);
