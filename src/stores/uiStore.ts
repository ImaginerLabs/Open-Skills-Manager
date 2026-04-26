import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type SidebarState = 'expanded' | 'collapsed';
export type ActiveView = 'library' | 'global' | 'project' | 'settings';

interface UIState {
  sidebarState: SidebarState;
  searchQuery: string;
  activeView: ActiveView;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarState: (state: SidebarState) => void;
  setSearchQuery: (query: string) => void;
  setActiveView: (view: ActiveView) => void;
}

export type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      sidebarState: 'expanded',
      searchQuery: '',
      activeView: 'library',

      toggleSidebar: () =>
        set((state) => ({
          sidebarState: state.sidebarState === 'expanded' ? 'collapsed' : 'expanded',
        })),
      setSidebarState: (sidebarState) => set({ sidebarState }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setActiveView: (activeView) => set({ activeView }),
    }),
    { name: 'ui-store' }
  )
);
