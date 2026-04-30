import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useSelectionStore } from './selectionStore';

describe('selectionStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    act(() => {
      useSelectionStore.getState().clearSelection();
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useSelectionStore.getState();
      expect(state.source).toBe('none');
      expect(state.libraryGroupId).toBeUndefined();
      expect(state.libraryCategoryId).toBeUndefined();
      expect(state.projectId).toBeNull();
    });
  });

  describe('selectLibrary', () => {
    it('should select library group', () => {
      act(() => {
        useSelectionStore.getState().selectLibrary('grp-test');
      });

      const state = useSelectionStore.getState();
      expect(state.source).toBe('library');
      expect(state.libraryGroupId).toBe('grp-test');
      expect(state.libraryCategoryId).toBeUndefined();
      expect(state.projectId).toBeNull();
    });

    it('should select library group and category', () => {
      act(() => {
        useSelectionStore.getState().selectLibrary('grp-test', 'cat-test');
      });

      const state = useSelectionStore.getState();
      expect(state.source).toBe('library');
      expect(state.libraryGroupId).toBe('grp-test');
      expect(state.libraryCategoryId).toBe('cat-test');
      expect(state.projectId).toBeNull();
    });

    it('should clear previous project selection', () => {
      // First select a project
      act(() => {
        useSelectionStore.getState().selectProject('proj-test');
      });

      // Then select library
      act(() => {
        useSelectionStore.getState().selectLibrary('grp-test');
      });

      const state = useSelectionStore.getState();
      expect(state.source).toBe('library');
      expect(state.projectId).toBeNull();
    });
  });

  describe('selectGlobal', () => {
    it('should select global', () => {
      act(() => {
        useSelectionStore.getState().selectGlobal();
      });

      const state = useSelectionStore.getState();
      expect(state.source).toBe('global');
      expect(state.libraryGroupId).toBeUndefined();
      expect(state.libraryCategoryId).toBeUndefined();
      expect(state.projectId).toBeNull();
    });

    it('should clear previous library selection', () => {
      // First select library
      act(() => {
        useSelectionStore.getState().selectLibrary('grp-test', 'cat-test');
      });

      // Then select global
      act(() => {
        useSelectionStore.getState().selectGlobal();
      });

      const state = useSelectionStore.getState();
      expect(state.source).toBe('global');
      expect(state.libraryGroupId).toBeUndefined();
      expect(state.libraryCategoryId).toBeUndefined();
    });
  });

  describe('selectProject', () => {
    it('should select project', () => {
      act(() => {
        useSelectionStore.getState().selectProject('proj-test');
      });

      const state = useSelectionStore.getState();
      expect(state.source).toBe('project');
      expect(state.projectId).toBe('proj-test');
      expect(state.libraryGroupId).toBeUndefined();
      expect(state.libraryCategoryId).toBeUndefined();
    });

    it('should clear selection when null is passed', () => {
      // First select a project
      act(() => {
        useSelectionStore.getState().selectProject('proj-test');
      });

      // Then pass null
      act(() => {
        useSelectionStore.getState().selectProject(null);
      });

      const state = useSelectionStore.getState();
      expect(state.source).toBe('none');
      expect(state.projectId).toBeNull();
    });

    it('should clear previous library selection', () => {
      // First select library
      act(() => {
        useSelectionStore.getState().selectLibrary('grp-test');
      });

      // Then select project
      act(() => {
        useSelectionStore.getState().selectProject('proj-test');
      });

      const state = useSelectionStore.getState();
      expect(state.source).toBe('project');
      expect(state.libraryGroupId).toBeUndefined();
    });
  });

  describe('clearSelection', () => {
    it('should clear all selections', () => {
      // First select something
      act(() => {
        useSelectionStore.getState().selectLibrary('grp-test', 'cat-test');
      });

      // Then clear
      act(() => {
        useSelectionStore.getState().clearSelection();
      });

      const state = useSelectionStore.getState();
      expect(state.source).toBe('none');
      expect(state.libraryGroupId).toBeUndefined();
      expect(state.libraryCategoryId).toBeUndefined();
      expect(state.projectId).toBeNull();
    });
  });

  describe('derived state methods', () => {
    it('isLibrarySelected should return correct value', () => {
      expect(useSelectionStore.getState().isLibrarySelected()).toBe(false);

      act(() => {
        useSelectionStore.getState().selectLibrary('grp-test');
      });

      expect(useSelectionStore.getState().isLibrarySelected()).toBe(true);
    });

    it('isGlobalSelected should return correct value', () => {
      expect(useSelectionStore.getState().isGlobalSelected()).toBe(false);

      act(() => {
        useSelectionStore.getState().selectGlobal();
      });

      expect(useSelectionStore.getState().isGlobalSelected()).toBe(true);
    });

    it('isProjectSelected should return correct value', () => {
      expect(useSelectionStore.getState().isProjectSelected()).toBe(false);

      act(() => {
        useSelectionStore.getState().selectProject('proj-test');
      });

      expect(useSelectionStore.getState().isProjectSelected()).toBe(true);
    });
  });

  describe('mutual exclusivity', () => {
    it('should maintain mutual exclusivity between selections', () => {
      // Select library
      act(() => {
        useSelectionStore.getState().selectLibrary('grp-1');
      });
      expect(useSelectionStore.getState().isLibrarySelected()).toBe(true);
      expect(useSelectionStore.getState().isGlobalSelected()).toBe(false);
      expect(useSelectionStore.getState().isProjectSelected()).toBe(false);

      // Select global
      act(() => {
        useSelectionStore.getState().selectGlobal();
      });
      expect(useSelectionStore.getState().isLibrarySelected()).toBe(false);
      expect(useSelectionStore.getState().isGlobalSelected()).toBe(true);
      expect(useSelectionStore.getState().isProjectSelected()).toBe(false);

      // Select project
      act(() => {
        useSelectionStore.getState().selectProject('proj-1');
      });
      expect(useSelectionStore.getState().isLibrarySelected()).toBe(false);
      expect(useSelectionStore.getState().isGlobalSelected()).toBe(false);
      expect(useSelectionStore.getState().isProjectSelected()).toBe(true);
    });
  });
});
