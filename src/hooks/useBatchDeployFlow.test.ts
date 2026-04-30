import { describe, it, expect, vi, beforeEach } from 'vitest';

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

  it('module should be importable', async () => {
    // Just verify the module can be imported without errors
    const module = await import('./useBatchDeployFlow');
    expect(module.useBatchDeployFlow).toBeDefined();
    expect(typeof module.useBatchDeployFlow).toBe('function');
  });
});