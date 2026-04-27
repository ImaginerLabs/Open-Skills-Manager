import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTauriDragDrop } from './useTauriDragDrop';

// Mock @tauri-apps/api/webview
const mockOnDragDropEvent = vi.fn();
const mockUnlisten = vi.fn();

vi.mock('@tauri-apps/api/webview', () => ({
  getCurrentWebview: () => ({
    onDragDropEvent: mockOnDragDropEvent,
  }),
}));

describe('useTauriDragDrop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnDragDropEvent.mockResolvedValue(mockUnlisten);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return isDragOver state', () => {
    const { result } = renderHook(() => useTauriDragDrop({ enabled: true }));

    expect(result.current.isDragOver).toBe(false);
  });

  it('should set isDragOver to true on drag over event', async () => {
    const { result } = renderHook(() => useTauriDragDrop({ enabled: true }));

    // Get the event handler from the mock
    await vi.waitFor(() => expect(mockOnDragDropEvent).toHaveBeenCalled());
    const eventHandler = mockOnDragDropEvent.mock.calls[0]?.[0];

    // Simulate drag over
    act(() => {
      eventHandler?.({ payload: { type: 'over' } });
    });

    expect(result.current.isDragOver).toBe(true);
  });

  it('should set isDragOver to false and call onDrop on drop event', async () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useTauriDragDrop({ enabled: true, onDrop }));

    await vi.waitFor(() => expect(mockOnDragDropEvent).toHaveBeenCalled());
    const eventHandler = mockOnDragDropEvent.mock.calls[0]?.[0];

    // First set drag over
    act(() => {
      eventHandler?.({ payload: { type: 'over' } });
    });
    expect(result.current.isDragOver).toBe(true);

    // Then drop
    act(() => {
      eventHandler?.({ payload: { type: 'drop', paths: ['/path/to/skill'] } });
    });

    expect(result.current.isDragOver).toBe(false);
    expect(onDrop).toHaveBeenCalledWith(['/path/to/skill']);
  });

  it('should set isDragOver to false on cancel event', async () => {
    const { result } = renderHook(() => useTauriDragDrop({ enabled: true }));

    await vi.waitFor(() => expect(mockOnDragDropEvent).toHaveBeenCalled());
    const eventHandler = mockOnDragDropEvent.mock.calls[0]?.[0];

    // First set drag over
    act(() => {
      eventHandler?.({ payload: { type: 'over' } });
    });
    expect(result.current.isDragOver).toBe(true);

    // Then cancel
    act(() => {
      eventHandler?.({ payload: { type: 'cancel' } });
    });

    expect(result.current.isDragOver).toBe(false);
  });

  it('should not listen when disabled', () => {
    renderHook(() => useTauriDragDrop({ enabled: false }));

    expect(mockOnDragDropEvent).not.toHaveBeenCalled();
  });

  it('should cleanup listener on unmount', async () => {
    const { unmount } = renderHook(() => useTauriDragDrop({ enabled: true }));

    await vi.waitFor(() => expect(mockOnDragDropEvent).toHaveBeenCalled());
    expect(mockUnlisten).not.toHaveBeenCalled();

    unmount();

    expect(mockUnlisten).toHaveBeenCalled();
  });

  it('should re-setup listener when enabled changes', async () => {
    const { rerender } = renderHook(
      ({ enabled }) => useTauriDragDrop({ enabled }),
      { initialProps: { enabled: false } }
    );

    expect(mockOnDragDropEvent).not.toHaveBeenCalled();

    // Enable
    rerender({ enabled: true });

    await vi.waitFor(() => expect(mockOnDragDropEvent).toHaveBeenCalled());
  });
});
