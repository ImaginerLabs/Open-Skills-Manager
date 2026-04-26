import { useState, useCallback, useEffect } from 'react';

interface ContextMenuState {
  type: 'category' | 'group';
  categoryId: string;
  groupId?: string | undefined;
  x: number;
  y: number;
}

interface UseContextMenuResult {
  contextMenu: ContextMenuState | null;
  handleContextMenu: (
    e: React.MouseEvent,
    type: 'category' | 'group',
    categoryId: string,
    groupId?: string
  ) => void;
  closeContextMenu: () => void;
}

export function useContextMenu(): UseContextMenuResult {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, type: 'category' | 'group', categoryId: string, groupId?: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        type,
        categoryId,
        groupId,
        x: e.clientX,
        y: e.clientY,
      });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) {
        closeContextMenu();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu, closeContextMenu]);

  return {
    contextMenu,
    handleContextMenu,
    closeContextMenu,
  };
}
