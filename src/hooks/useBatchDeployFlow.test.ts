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

vi.mock('../stores/libraryStore', () => ({
  useLibraryStore: vi.fn((selector) => {
    const state = {
      skills: [],
      groups: [],
      updateSkill: vi.fn(),
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
    refreshAll: vi.fn(),
  }),
}));

vi.mock('./useBatchDeploy', () => ({
  useBatchDeploy: () => ({
    status: 'idle',
    progress: 0,
    total: 0,
    currentSkillName: '',
    result: null,
    startDeploy: vi.fn(),
    cancel: vi.fn(),
    reset: vi.fn(),
    retryFailed: vi.fn(),
  }),
}));

describe('useBatchDeployFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be importable', async () => {
    const { useBatchDeployFlow } = await import('./useBatchDeployFlow');
    expect(useBatchDeployFlow).toBeDefined();
    expect(typeof useBatchDeployFlow).toBe('function');
  });

  it('should return expected properties', async () => {
    const { useBatchDeployFlow } = await import('./useBatchDeployFlow');
    const { result } = renderHook(() => useBatchDeployFlow());

    expect(result.current).toHaveProperty('showTargetDialog');
    expect(result.current).toHaveProperty('skills');
    expect(result.current).toHaveProperty('sourceInfo');
    expect(result.current).toHaveProperty('deployFromCategory');
    expect(result.current).toHaveProperty('deployFromGlobal');
    expect(result.current).toHaveProperty('deployFromProject');
    expect(result.current).toHaveProperty('executeDeploy');
    expect(result.current).toHaveProperty('closeTargetDialog');
    expect(result.current).toHaveProperty('closeProgressDialog');
  });
});