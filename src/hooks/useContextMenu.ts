import { useState, useCallback } from 'react';

export interface ContextMenuState<T = unknown> {
  data: T;
  x: number;
  y: number;
}

export function useContextMenu<T = unknown>(): {
  contextMenu: ContextMenuState<T> | null;
  open: (e: React.MouseEvent, data: T) => void;
  close: () => void;
} {
  const [contextMenu, setContextMenu] = useState<ContextMenuState<T> | null>(null);

  const open = useCallback((e: React.MouseEvent, data: T) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ data, x: e.clientX, y: e.clientY });
  }, []);

  const close = useCallback(() => {
    setContextMenu(null);
  }, []);

  return { contextMenu, open, close };
}
