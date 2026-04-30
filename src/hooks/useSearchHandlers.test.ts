import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock stores
vi.mock('../stores/uiStore', () => ({
  useUIStore: vi.fn((selector) => {
    const state = {
      showToast: vi.fn(),
      showConfirmDialog: vi.fn(),
      closeConfirmDialog: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../stores/projectStore', () => ({
  useProjectStore: vi.fn((selector) => {
    const state = {
      projects: [],
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('./useSidebarData', () => ({
  useSidebarData: () => ({
    refreshLibrary: vi.fn(),
    refreshGlobal: vi.fn(),
  }),
}));

describe('useSearchHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be importable', async () => {
    const { useSearchHandlers } = await import('./useSearchHandlers');
    expect(useSearchHandlers).toBeDefined();
    expect(typeof useSearchHandlers).toBe('function');
  });

  it('should return expected handlers', async () => {
    const { useSearchHandlers } = await import('./useSearchHandlers');
    const { result } = renderHook(() => useSearchHandlers());

    expect(result.current).toHaveProperty('handleDeploy');
    expect(result.current).toHaveProperty('handleExport');
    expect(result.current).toHaveProperty('handleCopyPath');
    expect(result.current).toHaveProperty('handleReveal');
    expect(result.current).toHaveProperty('handleDelete');
  });
});