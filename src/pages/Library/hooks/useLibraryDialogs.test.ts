import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLibraryDialogs } from './useLibraryDialogs';

describe('useLibraryDialogs', () => {
  it('should initialize all dialogs as closed', () => {
    const { result } = renderHook(() => useLibraryDialogs());

    expect(result.current.showImportDialog).toBe(false);
    expect(result.current.showExportDialog).toBe(false);
    expect(result.current.showCategoryManager).toBe(false);
    expect(result.current.showSkillDetail).toBe(false);
    expect(result.current.showSearchOverlay).toBe(false);
    expect(result.current.showExportProgress).toBe(false);
    expect(result.current.showImportProgress).toBe(false);
  });

  it('should toggle import dialog', () => {
    const { result } = renderHook(() => useLibraryDialogs());

    act(() => {
      result.current.toggleImportDialog();
    });

    expect(result.current.showImportDialog).toBe(true);

    act(() => {
      result.current.toggleImportDialog();
    });

    expect(result.current.showImportDialog).toBe(false);
  });

  it('should toggle export dialog', () => {
    const { result } = renderHook(() => useLibraryDialogs());

    act(() => {
      result.current.toggleExportDialog();
    });

    expect(result.current.showExportDialog).toBe(true);
  });

  it('should toggle category manager', () => {
    const { result } = renderHook(() => useLibraryDialogs());

    act(() => {
      result.current.toggleCategoryManager();
    });

    expect(result.current.showCategoryManager).toBe(true);
  });

  it('should toggle skill detail', () => {
    const { result } = renderHook(() => useLibraryDialogs());

    act(() => {
      result.current.toggleSkillDetail();
    });

    expect(result.current.showSkillDetail).toBe(true);
  });

  it('should toggle search overlay', () => {
    const { result } = renderHook(() => useLibraryDialogs());

    act(() => {
      result.current.toggleSearchOverlay();
    });

    expect(result.current.showSearchOverlay).toBe(true);
  });

  it('should toggle export progress', () => {
    const { result } = renderHook(() => useLibraryDialogs());

    act(() => {
      result.current.toggleExportProgress();
    });

    expect(result.current.showExportProgress).toBe(true);
  });

  it('should toggle import progress', () => {
    const { result } = renderHook(() => useLibraryDialogs());

    act(() => {
      result.current.toggleImportProgress();
    });

    expect(result.current.showImportProgress).toBe(true);
  });

  it('should set import dialog explicitly', () => {
    const { result } = renderHook(() => useLibraryDialogs());

    act(() => {
      result.current.setImportDialog(true);
    });

    expect(result.current.showImportDialog).toBe(true);

    act(() => {
      result.current.setImportDialog(false);
    });

    expect(result.current.showImportDialog).toBe(false);
  });

  it('should set export dialog explicitly', () => {
    const { result } = renderHook(() => useLibraryDialogs());

    act(() => {
      result.current.setExportDialog(true);
    });

    expect(result.current.showExportDialog).toBe(true);
  });

  it('should set category manager explicitly', () => {
    const { result } = renderHook(() => useLibraryDialogs());

    act(() => {
      result.current.setCategoryManager(true);
    });

    expect(result.current.showCategoryManager).toBe(true);
  });

  it('should set skill detail explicitly', () => {
    const { result } = renderHook(() => useLibraryDialogs());

    act(() => {
      result.current.setSkillDetail(true);
    });

    expect(result.current.showSkillDetail).toBe(true);
  });

  it('should set search overlay explicitly', () => {
    const { result } = renderHook(() => useLibraryDialogs());

    act(() => {
      result.current.setSearchOverlay(true);
    });

    expect(result.current.showSearchOverlay).toBe(true);
  });

  it('should set export progress explicitly', () => {
    const { result } = renderHook(() => useLibraryDialogs());

    act(() => {
      result.current.setExportProgress(true);
    });

    expect(result.current.showExportProgress).toBe(true);
  });

  it('should set import progress explicitly', () => {
    const { result } = renderHook(() => useLibraryDialogs());

    act(() => {
      result.current.setImportProgress(true);
    });

    expect(result.current.showImportProgress).toBe(true);
  });

  it('should provide stable callback references', () => {
    const { result, rerender } = renderHook(() => useLibraryDialogs());

    const firstToggleImport = result.current.toggleImportDialog;
    const firstToggleExport = result.current.toggleExportDialog;
    const firstSetImport = result.current.setImportDialog;

    rerender();

    expect(result.current.toggleImportDialog).toBe(firstToggleImport);
    expect(result.current.toggleExportDialog).toBe(firstToggleExport);
    expect(result.current.setImportDialog).toBe(firstSetImport);
  });

  it('should close all dialogs', () => {
    const { result } = renderHook(() => useLibraryDialogs());

    // Open all dialogs
    act(() => {
      result.current.setImportDialog(true);
      result.current.setExportDialog(true);
      result.current.setCategoryManager(true);
      result.current.setSkillDetail(true);
      result.current.setSearchOverlay(true);
      result.current.setExportProgress(true);
      result.current.setImportProgress(true);
    });

    // Verify all are open
    expect(result.current.showImportDialog).toBe(true);
    expect(result.current.showExportDialog).toBe(true);
    expect(result.current.showCategoryManager).toBe(true);
    expect(result.current.showSkillDetail).toBe(true);
    expect(result.current.showSearchOverlay).toBe(true);
    expect(result.current.showExportProgress).toBe(true);
    expect(result.current.showImportProgress).toBe(true);

    // Close all
    act(() => {
      result.current.closeAllDialogs();
    });

    // Verify all are closed
    expect(result.current.showImportDialog).toBe(false);
    expect(result.current.showExportDialog).toBe(false);
    expect(result.current.showCategoryManager).toBe(false);
    expect(result.current.showSkillDetail).toBe(false);
    expect(result.current.showSearchOverlay).toBe(false);
    expect(result.current.showExportProgress).toBe(false);
    expect(result.current.showImportProgress).toBe(false);
  });
});
