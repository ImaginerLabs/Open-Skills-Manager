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

  // Note: Full hook tests would require more complex setup
  // This is a basic test to verify the hook can be imported and used

  it('should be importable', async () => {
    const { useSelection } = await import('./useSelection');
    expect(useSelection).toBeDefined();
    expect(typeof useSelection).toBe('function');
  });
});