import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useBatchDeploy } from '@/hooks/useBatchDeploy';
import type { LibrarySkill } from '@/stores/libraryStore';
import * as ipcService from '@/services/ipcService';

// Mock ipcService
vi.mock('@/services/ipcService', () => ({
  invokeIPC: vi.fn(),
}));

describe('useBatchDeploy', () => {
  const mockSkills: LibrarySkill[] = [
    {
      id: 'skill-1',
      name: 'Skill 1',
      folderName: 'skill-1',
      version: '1.0.0',
      description: 'Test skill 1',
      path: '/path/to/skill-1',
      skillMdPath: '/path/to/skill-1/SKILL.md',
      skillMdLines: 50,
      skillMdChars: 1200,
      importedAt: new Date(),
      size: 1024,
      fileCount: 5,
      hasResources: false,
      deployments: [],
      isSymlink: false,
    },
    {
      id: 'skill-2',
      name: 'Skill 2',
      folderName: 'skill-2',
      version: '1.0.0',
      description: 'Test skill 2',
      path: '/path/to/skill-2',
      skillMdPath: '/path/to/skill-2/SKILL.md',
      skillMdLines: 30,
      skillMdChars: 800,
      importedAt: new Date(),
      size: 2048,
      fileCount: 3,
      hasResources: false,
      deployments: [],
      isSymlink: false,
    },
    {
      id: 'skill-3',
      name: 'Skill 3',
      folderName: 'skill-3',
      version: '1.0.0',
      description: 'Test skill 3',
      path: '/path/to/skill-3',
      skillMdPath: '/path/to/skill-3/SKILL.md',
      skillMdLines: 20,
      skillMdChars: 500,
      importedAt: new Date(),
      size: 512,
      fileCount: 2,
      hasResources: false,
      deployments: [],
      isSymlink: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with idle state', () => {
    const { result } = renderHook(() => useBatchDeploy());

    expect(result.current.status).toBe('idle');
    expect(result.current.progress).toBe(0);
    expect(result.current.total).toBe(0);
    expect(result.current.currentSkillName).toBe('');
    expect(result.current.result).toBeNull();
  });

  it('starts batch deploy and updates progress', async () => {
    vi.mocked(ipcService.invokeIPC).mockResolvedValue({ success: true, data: undefined });

    const { result } = renderHook(() => useBatchDeploy());

    act(() => {
      result.current.startDeploy(mockSkills, 'global');
    });

    expect(result.current.status).toBe('deploying');
    expect(result.current.total).toBe(3);
  });

  it('calls deploy_to_global for each skill when deploying to global', async () => {
    vi.mocked(ipcService.invokeIPC).mockResolvedValue({ success: true, data: undefined });

    const { result } = renderHook(() => useBatchDeploy());

    act(() => {
      result.current.startDeploy(mockSkills, 'global');
    });

    await waitFor(() => {
      expect(ipcService.invokeIPC).toHaveBeenCalledTimes(3);
    });

    expect(ipcService.invokeIPC).toHaveBeenCalledWith('deploy_to_global', { skillId: 'skill-1' });
    expect(ipcService.invokeIPC).toHaveBeenCalledWith('deploy_to_global', { skillId: 'skill-2' });
    expect(ipcService.invokeIPC).toHaveBeenCalledWith('deploy_to_global', { skillId: 'skill-3' });
  });

  it('calls deploy_to_project for each skill when deploying to project', async () => {
    vi.mocked(ipcService.invokeIPC).mockResolvedValue({ success: true, data: undefined });

    const { result } = renderHook(() => useBatchDeploy());

    act(() => {
      result.current.startDeploy(mockSkills, 'project', 'project-123');
    });

    await waitFor(() => {
      expect(ipcService.invokeIPC).toHaveBeenCalledTimes(3);
    });

    expect(ipcService.invokeIPC).toHaveBeenCalledWith('deploy_to_project', {
      skillId: 'skill-1',
      projectId: 'project-123',
    });
  });

  it('records successful deployments', async () => {
    vi.mocked(ipcService.invokeIPC).mockResolvedValue({ success: true, data: undefined });

    const { result } = renderHook(() => useBatchDeploy());

    act(() => {
      result.current.startDeploy(mockSkills, 'global');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('completed');
    });

    expect(result.current.result?.success).toHaveLength(3);
    expect(result.current.result?.failed).toHaveLength(0);
    expect(result.current.result?.cancelled).toHaveLength(0);
  });

  it('records failed deployments', async () => {
    vi.mocked(ipcService.invokeIPC)
      .mockResolvedValueOnce({ success: true, data: undefined })
      .mockResolvedValueOnce({ success: false, error: { code: 'NOT_FOUND', message: 'Skill not found' } })
      .mockResolvedValueOnce({ success: true, data: undefined });

    const { result } = renderHook(() => useBatchDeploy());

    act(() => {
      result.current.startDeploy(mockSkills, 'global');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('completed');
    });

    expect(result.current.result?.success).toHaveLength(2);
    expect(result.current.result?.failed).toHaveLength(1);
    expect(result.current.result?.failed[0]?.skillId).toBe('skill-2');
  });

  it('supports cancellation', async () => {
    vi.mocked(ipcService.invokeIPC).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: undefined }), 100))
    );

    const { result } = renderHook(() => useBatchDeploy());

    act(() => {
      result.current.startDeploy(mockSkills, 'global');
    });

    // Cancel immediately
    act(() => {
      result.current.cancel();
    });

    expect(result.current.status).toBe('cancelled');

    // Wait for result to be populated
    await waitFor(() => {
      expect(result.current.result).not.toBeNull();
    });

    expect(result.current.result?.cancelled.length).toBeGreaterThan(0);
  });

  it('resets state correctly', async () => {
    vi.mocked(ipcService.invokeIPC).mockResolvedValue({ success: true, data: undefined });

    const { result } = renderHook(() => useBatchDeploy());

    act(() => {
      result.current.startDeploy(mockSkills, 'global');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('completed');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeNull();
  });

  it('updates progress during deployment', async () => {
    vi.mocked(ipcService.invokeIPC).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: undefined }), 50))
    );

    const { result } = renderHook(() => useBatchDeploy());

    act(() => {
      result.current.startDeploy(mockSkills, 'global');
    });

    // Wait for first skill
    await waitFor(() => {
      expect(result.current.progress).toBeGreaterThanOrEqual(1);
    });

    // Wait for completion
    await waitFor(() => {
      expect(result.current.progress).toBe(3);
    });
  });

  it('handles empty skill list', async () => {
    const { result } = renderHook(() => useBatchDeploy());

    act(() => {
      result.current.startDeploy([], 'global');
    });

    expect(result.current.status).toBe('completed');
    expect(result.current.total).toBe(0);
  });

  it('requires projectId for project deployment', async () => {
    const { result } = renderHook(() => useBatchDeploy());

    act(() => {
      result.current.startDeploy(mockSkills, 'project');
    });

    // Should not call any IPC
    expect(ipcService.invokeIPC).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });
});
