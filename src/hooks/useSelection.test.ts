import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useSelectionStore } from '../stores/selectionStore';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/library' };

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock stores
vi.mock('../stores/libraryStore', () => ({
  useLibraryStore: vi.fn((selector) => {
    const state = {
      selectGroup: vi.fn(),
      selectCategory: vi.fn(),
    };
    return selector(state);
  }),
}));

vi.mock('../stores/projectStore', () => ({
  useProjectStore: vi.fn((selector) => {
    const state = {
      selectProject: vi.fn(),
      projects: [],
    };
    return selector(state);
  }),
}));

describe('useSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useSelectionStore.getState().clearSelection();
    });
  });

  it('useSelectionStore should have correct initial state', () => {
    const state = useSelectionStore.getState();
    expect(state.source).toBe('none');
    expect(state.libraryGroupId).toBeUndefined();
    expect(state.libraryCategoryId).toBeUndefined();
    expect(state.projectId).toBeNull();
  });

  it('useSelectionStore selectLibrary should update state', () => {
    act(() => {
      useSelectionStore.getState().selectLibrary('group-1', 'category-1');
    });
    const state = useSelectionStore.getState();
    expect(state.source).toBe('library');
    expect(state.libraryGroupId).toBe('group-1');
    expect(state.libraryCategoryId).toBe('category-1');
  });

  it('useSelectionStore selectGlobal should update state', () => {
    act(() => {
      useSelectionStore.getState().selectGlobal();
    });
    const state = useSelectionStore.getState();
    expect(state.source).toBe('global');
  });

  it('useSelectionStore selectProject should update state', () => {
    act(() => {
      useSelectionStore.getState().selectProject('project-1');
    });
    const state = useSelectionStore.getState();
    expect(state.source).toBe('project');
    expect(state.projectId).toBe('project-1');
  });
});