import { useState, useEffect, useCallback } from 'react';
import { getCurrentWebview } from '@tauri-apps/api/webview';

interface UseTauriDragDropOptions {
  enabled: boolean;
  onDrop?: (paths: string[]) => void;
}

interface UseTauriDragDropResult {
  isDragOver: boolean;
}

export function useTauriDragDrop(options: UseTauriDragDropOptions): UseTauriDragDropResult {
  const { enabled, onDrop } = options;
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (paths: string[]) => {
      onDrop?.(paths);
    },
    [onDrop]
  );

  useEffect(() => {
    if (!enabled) return;

    let unlisten: (() => void) | undefined;

    const setupDragDrop = async () => {
      unlisten = await getCurrentWebview().onDragDropEvent((event) => {
        if (event.payload.type === 'over') {
          setIsDragOver(true);
        } else if (event.payload.type === 'drop') {
          setIsDragOver(false);
          handleDrop(event.payload.paths);
        } else {
          // cancel
          setIsDragOver(false);
        }
      });
    };

    setupDragDrop();

    return () => {
      unlisten?.();
    };
  }, [enabled, handleDrop]);

  return { isDragOver };
}
