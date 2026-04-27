import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLibraryExport } from './useLibraryExport';
import { useLibraryStore } from '../../../stores/libraryStore';
import { useUIStore } from '../../../stores/uiStore';
import * as libraryServiceModule from '../../../services/libraryService';

vi.mock('../../../services/libraryService', () => ({
  libraryService: {
    export: vi.fn(),
    exportBatch: vi.fn(),
  },
}));

describe('useLibraryExport', () => {
  const mockSkill = {
    id: 'skill-1',
    name: 'Test Skill',
    folderName: 'test-skill',
    version: '1.0.0',
    description: 'A test skill',
    path: '/path/to/skill',
    skillMdPath: '/path/to/skill/SKILL.md',
    skillMdLines: 100,
    skillMdChars: 5000,
    importedAt: new Date(),
    size: 1024,
    fileCount: 5,
    hasResources: false,
    deployments: [],
    isSymlink: false,
  };

  const showToastSpy = vi.spyOn(useUIStore.getState(), 'showToast');

  beforeEach(() => {
    vi.clearAllMocks();
    useLibraryStore.setState({
      exportProgress: {
        current: 0,
        total: 0,
        currentSkillName: '',
        status: 'idle',
      },
    });
  });

  it('should export single skill as zip', async () => {
    vi.mocked(libraryServiceModule.libraryService.export).mockResolvedValue({
      success: true,
      data: '/export/path',
    });

    const { result } = renderHook(() => useLibraryExport());

    await act(async () => {
      await result.current.handleExportStart('zip', [mockSkill]);
    });

    const state = useLibraryStore.getState();
    expect(state.exportProgress.total).toBe(1);
    expect(state.exportProgress.status).toBe('completed');
    expect(showToastSpy).toHaveBeenCalledWith('success', 'Exported 1 skill successfully');
  });

  it('should export multiple skills as zip (batch)', async () => {
    const skills = [
      mockSkill,
      { ...mockSkill, id: 'skill-2', name: 'Test Skill 2' },
    ];

    vi.mocked(libraryServiceModule.libraryService.exportBatch).mockResolvedValue({
      success: true,
      data: '/export/path',
    });

    const { result } = renderHook(() => useLibraryExport());

    await act(async () => {
      await result.current.handleExportStart('zip', skills);
    });

    expect(libraryServiceModule.libraryService.exportBatch).toHaveBeenCalledWith(
      ['skill-1', 'skill-2'],
      'skills-export.zip'
    );
    const state = useLibraryStore.getState();
    expect(state.exportProgress.status).toBe('completed');
    expect(showToastSpy).toHaveBeenCalledWith('success', 'Exported 2 skills successfully');
  });

  it('should export skills individually as folder format', async () => {
    const skills = [
      mockSkill,
      { ...mockSkill, id: 'skill-2', name: 'Test Skill 2' },
    ];

    vi.mocked(libraryServiceModule.libraryService.export).mockResolvedValue({
      success: true,
      data: '/export/path',
    });

    const { result } = renderHook(() => useLibraryExport());

    await act(async () => {
      await result.current.handleExportStart('folder', skills);
    });

    expect(libraryServiceModule.libraryService.export).toHaveBeenCalledTimes(2);
    const state = useLibraryStore.getState();
    expect(state.exportProgress.status).toBe('completed');
    expect(showToastSpy).toHaveBeenCalledWith('success', 'Exported 2 skills successfully');
  });

  it('should handle user cancellation', async () => {
    vi.mocked(libraryServiceModule.libraryService.export).mockResolvedValue(null);

    const { result } = renderHook(() => useLibraryExport());

    await act(async () => {
      await result.current.handleExportStart('zip', [mockSkill]);
    });

    const state = useLibraryStore.getState();
    expect(state.exportProgress.status).toBe('idle');
    expect(showToastSpy).not.toHaveBeenCalled();
  });

  it('should handle export error', async () => {
    vi.mocked(libraryServiceModule.libraryService.export).mockResolvedValue({
      success: false,
      error: { message: 'Export failed', code: 'INTERNAL_ERROR' },
    });

    const { result } = renderHook(() => useLibraryExport());

    await act(async () => {
      await result.current.handleExportStart('zip', [mockSkill]);
    });

    const state = useLibraryStore.getState();
    expect(state.exportProgress.status).toBe('error');
    expect(showToastSpy).toHaveBeenCalledWith('error', 'Export failed');
  });

  it('should handle unexpected errors', async () => {
    vi.mocked(libraryServiceModule.libraryService.export).mockRejectedValue(new Error('Unexpected error'));

    const { result } = renderHook(() => useLibraryExport());

    await act(async () => {
      await result.current.handleExportStart('zip', [mockSkill]);
    });

    const state = useLibraryStore.getState();
    expect(state.exportProgress.status).toBe('error');
    expect(showToastSpy).toHaveBeenCalledWith('error', 'Unexpected error');
  });

  it('should provide stable callback reference', () => {
    const { result, rerender } = renderHook(() => useLibraryExport());

    const firstHandleExportStart = result.current.handleExportStart;

    rerender();

    expect(result.current.handleExportStart).toBe(firstHandleExportStart);
  });
});
