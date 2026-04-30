import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useUIStore } from '@/stores/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.getState().reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useUIStore.getState();

      expect(state.sidebarState).toBe('expanded');
      expect(state.activeView).toBe('library');
      expect(state.viewMode).toBe('list');
      expect(state.toasts).toEqual([]);
      expect(state.confirmDialog).toBeNull();
      expect(state.search.isSearchOpen).toBe(false);
      expect(state.search.searchQuery).toBe('');
    });
  });

  describe('sidebar state', () => {
    it('should toggle sidebar from expanded to collapsed', () => {
      const { toggleSidebar } = useUIStore.getState();
      toggleSidebar();

      expect(useUIStore.getState().sidebarState).toBe('collapsed');
    });

    it('should toggle sidebar from collapsed to expanded', () => {
      const { setSidebarState, toggleSidebar } = useUIStore.getState();
      setSidebarState('collapsed');
      toggleSidebar();

      expect(useUIStore.getState().sidebarState).toBe('expanded');
    });

    it('should set sidebar state directly', () => {
      const { setSidebarState } = useUIStore.getState();
      setSidebarState('collapsed');

      expect(useUIStore.getState().sidebarState).toBe('collapsed');
    });
  });

  describe('active view', () => {
    it('should set active view to library', () => {
      const { setActiveView } = useUIStore.getState();
      setActiveView('library');

      expect(useUIStore.getState().activeView).toBe('library');
    });

    it('should set active view to global', () => {
      const { setActiveView } = useUIStore.getState();
      setActiveView('global');

      expect(useUIStore.getState().activeView).toBe('global');
    });

    it('should set active view to project', () => {
      const { setActiveView } = useUIStore.getState();
      setActiveView('project');

      expect(useUIStore.getState().activeView).toBe('project');
    });

    it('should set active view to settings', () => {
      const { setActiveView } = useUIStore.getState();
      setActiveView('settings');

      expect(useUIStore.getState().activeView).toBe('settings');
    });
  });

  describe('view mode', () => {
    it('should set view mode to grid', () => {
      const { setViewMode } = useUIStore.getState();
      setViewMode('grid');

      expect(useUIStore.getState().viewMode).toBe('grid');
    });

    it('should set view mode to list', () => {
      const { setViewMode } = useUIStore.getState();
      setViewMode('grid');
      setViewMode('list');

      expect(useUIStore.getState().viewMode).toBe('list');
    });
  });

  describe('toast management', () => {
    it('should show a success toast', () => {
      const { showToast } = useUIStore.getState();
      showToast('success', 'Operation completed');

      const state = useUIStore.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0]?.type).toBe('success');
      expect(state.toasts[0]?.message).toBe('Operation completed');
    });

    it('should show an error toast', () => {
      const { showToast } = useUIStore.getState();
      showToast('error', 'Something went wrong');

      const state = useUIStore.getState();
      expect(state.toasts[0]?.type).toBe('error');
    });

    it('should show a warning toast', () => {
      const { showToast } = useUIStore.getState();
      showToast('warning', 'Be careful');

      const state = useUIStore.getState();
      expect(state.toasts[0]?.type).toBe('warning');
    });

    it('should show an info toast', () => {
      const { showToast } = useUIStore.getState();
      showToast('info', 'Information');

      const state = useUIStore.getState();
      expect(state.toasts[0]?.type).toBe('info');
    });

    it('should use default duration of 3000ms', () => {
      const { showToast } = useUIStore.getState();
      showToast('success', 'Test');

      const state = useUIStore.getState();
      expect(state.toasts[0]?.duration).toBe(3000);
    });

    it('should use custom duration', () => {
      const { showToast } = useUIStore.getState();
      showToast('success', 'Test', 5000);

      const state = useUIStore.getState();
      expect(state.toasts[0]?.duration).toBe(5000);
    });

    it('should auto-dismiss toast after duration', () => {
      const { showToast } = useUIStore.getState();
      showToast('success', 'Test', 3000);

      expect(useUIStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(3000);

      expect(useUIStore.getState().toasts).toHaveLength(0);
    });

    it('should manually dismiss toast', () => {
      const { showToast, dismissToast } = useUIStore.getState();
      showToast('success', 'Test');
      const toastId = useUIStore.getState().toasts[0]?.id;

      if (toastId) {
        dismissToast(toastId);
      }

      expect(useUIStore.getState().toasts).toHaveLength(0);
    });

    it('should not dismiss wrong toast id', () => {
      const { showToast, dismissToast } = useUIStore.getState();
      showToast('success', 'Test');
      dismissToast('wrong-id');

      expect(useUIStore.getState().toasts).toHaveLength(1);
    });

    it('should handle multiple toasts', () => {
      const { showToast } = useUIStore.getState();
      showToast('success', 'First');
      showToast('error', 'Second');
      showToast('info', 'Third');

      const state = useUIStore.getState();
      expect(state.toasts).toHaveLength(3);
    });

    it('should dismiss specific toast from multiple', () => {
      const { showToast, dismissToast } = useUIStore.getState();
      showToast('success', 'First');
      showToast('error', 'Second');

      const firstId = useUIStore.getState().toasts[0]?.id;
      if (firstId) {
        dismissToast(firstId);
      }

      const state = useUIStore.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0]?.message).toBe('Second');
    });
  });

  describe('confirm dialog', () => {
    it('should show confirm dialog', () => {
      const { showConfirmDialog } = useUIStore.getState();
      const onConfirm = vi.fn();
      showConfirmDialog({
        title: 'Delete Item',
        message: 'Are you sure?',
        onConfirm,
      });

      const state = useUIStore.getState();
      expect(state.confirmDialog).not.toBeNull();
      expect(state.confirmDialog?.open).toBe(true);
      expect(state.confirmDialog?.title).toBe('Delete Item');
      expect(state.confirmDialog?.message).toBe('Are you sure?');
    });

    it('should show confirm dialog with custom button text', () => {
      const { showConfirmDialog } = useUIStore.getState();
      const onConfirm = vi.fn();
      showConfirmDialog({
        title: 'Delete',
        message: 'Sure?',
        confirmText: 'Yes, delete',
        cancelText: 'No, keep',
        onConfirm,
      });

      const state = useUIStore.getState();
      expect(state.confirmDialog?.confirmText).toBe('Yes, delete');
      expect(state.confirmDialog?.cancelText).toBe('No, keep');
    });

    it('should close confirm dialog', () => {
      const { showConfirmDialog, closeConfirmDialog } = useUIStore.getState();
      const onConfirm = vi.fn();
      showConfirmDialog({ title: 'Test', message: 'Test', onConfirm });
      closeConfirmDialog();

      const state = useUIStore.getState();
      expect(state.confirmDialog?.open).toBe(false);
    });

    it('should not change state if no dialog exists', () => {
      const { closeConfirmDialog } = useUIStore.getState();
      closeConfirmDialog();

      expect(useUIStore.getState().confirmDialog).toBeNull();
    });
  });

  describe('search state', () => {
    it('should open search', () => {
      const { searchActions } = useUIStore.getState();
      searchActions.openSearch();

      expect(useUIStore.getState().search.isSearchOpen).toBe(true);
    });

    it('should close search', () => {
      const { searchActions } = useUIStore.getState();
      searchActions.openSearch();
      searchActions.closeSearch();

      expect(useUIStore.getState().search.isSearchOpen).toBe(false);
    });

    it('should set search query', () => {
      const { searchActions } = useUIStore.getState();
      searchActions.setSearchQuery('test query');

      expect(useUIStore.getState().search.searchQuery).toBe('test query');
    });

    it('should set search scope', () => {
      const { searchActions } = useUIStore.getState();
      searchActions.setSearchScope('library');

      expect(useUIStore.getState().search.searchScope).toBe('library');
    });

    it('should set selected project id', () => {
      const { searchActions } = useUIStore.getState();
      searchActions.setSelectedProjectId('proj-1');

      expect(useUIStore.getState().search.selectedProjectId).toBe('proj-1');
    });

    it('should clear selected project id', () => {
      const { searchActions } = useUIStore.getState();
      searchActions.setSelectedProjectId('proj-1');
      searchActions.setSelectedProjectId(null);

      expect(useUIStore.getState().search.selectedProjectId).toBeNull();
    });

    it('should set selected category id', () => {
      const { searchActions } = useUIStore.getState();
      searchActions.setSelectedCategoryId('cat-1');

      expect(useUIStore.getState().search.selectedCategoryId).toBe('cat-1');
    });

    it('should set search results', () => {
      const { searchActions } = useUIStore.getState();
      const results = {
        library: [{ id: '1', name: 'Skill', description: '', scope: 'library' as const, path: '/path', size: 100, fileCount: 1 }],
        global: [],
        projects: {},
      };
      searchActions.setSearchResults(results);

      expect(useUIStore.getState().search.searchResults).toEqual(results);
    });

    it('should set searching state', () => {
      const { searchActions } = useUIStore.getState();
      searchActions.setSearching(true);

      expect(useUIStore.getState().search.isSearching).toBe(true);
    });

    it('should toggle group collapse', () => {
      const { searchActions } = useUIStore.getState();
      searchActions.toggleGroupCollapse('group-1');

      expect(useUIStore.getState().search.collapsedGroups['group-1']).toBe(true);

      searchActions.toggleGroupCollapse('group-1');
      expect(useUIStore.getState().search.collapsedGroups['group-1']).toBe(false);
    });

    it('should reset search to initial state', () => {
      const { searchActions } = useUIStore.getState();
      searchActions.openSearch();
      searchActions.setSearchQuery('test');
      searchActions.setSearchScope('global');
      searchActions.resetSearch();

      const state = useUIStore.getState().search;
      expect(state.isSearchOpen).toBe(false);
      expect(state.searchQuery).toBe('');
      expect(state.searchScope).toBe('all');
    });
  });

  describe('complex scenarios', () => {
    it('should handle view change with sidebar toggle', () => {
      const { setActiveView, toggleSidebar } = useUIStore.getState();
      setActiveView('settings');
      toggleSidebar();

      const state = useUIStore.getState();
      expect(state.activeView).toBe('settings');
      expect(state.sidebarState).toBe('collapsed');
    });

    it('should handle search workflow', () => {
      const { searchActions, showToast } = useUIStore.getState();

      searchActions.openSearch();
      searchActions.setSearchQuery('skill');
      searchActions.setSearching(true);
      searchActions.setSearchResults({
        library: [{ id: '1', name: 'Skill', description: '', scope: 'library' as const, path: '/path', size: 100, fileCount: 1 }],
        global: [],
        projects: {},
      });
      searchActions.setSearching(false);

      if (useUIStore.getState().search.searchResults?.library.length === 0) {
        showToast('info', 'No results found');
      }

      const state = useUIStore.getState();
      expect(state.search.isSearchOpen).toBe(true);
      expect(state.search.searchQuery).toBe('skill');
      expect(state.search.isSearching).toBe(false);
      expect(state.search.searchResults?.library).toHaveLength(1);
    });
  });
});