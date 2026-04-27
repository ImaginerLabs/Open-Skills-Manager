import { useEffect, useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';

export interface UseSearchKeyboardResult {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

export function useSearchKeyboard(): UseSearchKeyboardResult {
  const isOpen = useUIStore((state) => state.search.isSearchOpen);
  const searchActions = useUIStore((state) => state.searchActions);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isCmdOrCtrl = event.metaKey || event.ctrlKey;

    if (isCmdOrCtrl && event.key === 'f') {
      event.preventDefault();
      searchActions.openSearch();
    }

    if (event.key === 'Escape' && isOpen) {
      searchActions.closeSearch();
    }
  }, [isOpen, searchActions]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    isOpen,
    openSearch: searchActions.openSearch,
    closeSearch: searchActions.closeSearch,
  };
}