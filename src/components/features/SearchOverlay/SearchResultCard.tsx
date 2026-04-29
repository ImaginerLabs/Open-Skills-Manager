import { useState, useRef, useCallback } from 'react';
import { SquaresFour, Globe, Folder, Export, Copy, Trash, ArrowSquareOut, ArrowDown } from '@phosphor-icons/react';
import type { SearchResult } from '../../../stores/uiStore';
import { ContextMenu, type ContextMenuItem } from '../../common/ContextMenu';
import styles from './SearchOverlay.module.scss';

export interface SearchResultCardProps {
  result: SearchResult;
  query: string;
  onClick?: ((result: SearchResult) => void) | undefined;
  onDeploy?: ((result: SearchResult) => void) | undefined;
  onExport?: ((result: SearchResult) => void) | undefined;
  onPull?: ((result: SearchResult) => void) | undefined;
  onCopyPath?: ((result: SearchResult) => void) | undefined;
  onDelete?: ((result: SearchResult) => void) | undefined;
}

const SCOPE_COLORS = {
  library: '#0A84FF',
  global: '#30D158',
  project: '#FF9F0A',
};

const SCOPE_ICONS = {
  library: SquaresFour,
  global: Globe,
  project: Folder,
};

export function SearchResultCard({
  result,
  query,
  onClick,
  onDeploy,
  onExport,
  onPull,
  onCopyPath,
  onDelete,
}: SearchResultCardProps): React.ReactElement {
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => {
    setMenuPosition(null);
  }, []);

  const isLibrary = result.scope === 'library';

  const menuItems: ContextMenuItem[] = [
    ...(isLibrary && onDeploy ? [{
      id: 'deploy',
      label: 'Deploy to...',
      icon: ArrowSquareOut,
      onClick: () => onDeploy(result),
    }] : []),
    ...(isLibrary && onExport ? [{
      id: 'export',
      label: 'Export',
      icon: Export,
      onClick: () => onExport(result),
    }] : []),
    ...(!isLibrary && onPull ? [{
      id: 'pull',
      label: 'Pull to Library',
      icon: ArrowDown,
      onClick: () => onPull(result),
    }] : []),
    ...(!isLibrary && onExport ? [{
      id: 'export',
      label: 'Export',
      icon: Export,
      onClick: () => onExport(result),
    }] : []),
    ...(onCopyPath ? [{
      id: 'copy-path',
      label: 'Copy Path',
      icon: Copy,
      onClick: () => onCopyPath(result),
    }] : []),
    ...(onDelete ? [{
      id: 'delete',
      label: 'Delete',
      icon: Trash,
      variant: 'danger' as const,
      onClick: () => onDelete(result),
    }] : []),
  ];

  const highlightMatch = (text: string, searchTerm: string): React.ReactNode => {
    if (!searchTerm || searchTerm.length < 2) return text;

    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.toLowerCase() === searchTerm.toLowerCase()) {
        return (
          <mark key={index} className={styles.highlight}>
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  const escapeRegExp = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const Snippet = ({ text, searchTerm }: { text: string; searchTerm: string }) => {
    if (!text) return null;

    const contextLength = 50;
    const lowerText = text.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerTerm);

    if (matchIndex === -1) return null;

    const start = Math.max(0, matchIndex - contextLength);
    const end = Math.min(text.length, matchIndex + searchTerm.length + contextLength);
    const snippet = text.slice(start, end);
    const displaySnippet = (start > 0 ? '...' : '') + snippet + (end < text.length ? '...' : '');

    return <div className={styles.snippet}>{highlightMatch(displaySnippet, searchTerm)}</div>;
  };

  const ScopeIcon = SCOPE_ICONS[result.scope];

  return (
    <>
      <div
        ref={cardRef}
        className={styles.resultCard}
        onContextMenu={handleContextMenu}
        onClick={() => onClick?.(result)}
        role="button"
        tabIndex={0}
      >
        <div className={styles.cardHeader}>
          <h4 className={styles.resultName}>{highlightMatch(result.name, query)}</h4>
          <div
            className={styles.scopeBadge}
            style={{ backgroundColor: `${SCOPE_COLORS[result.scope]}15`, color: SCOPE_COLORS[result.scope] }}
          >
            <ScopeIcon size={12} />
            <span>{result.scope}</span>
          </div>
        </div>
        <p className={styles.resultDescription}>{result.description}</p>
        {result.matchedSnippet && <Snippet text={result.matchedSnippet} searchTerm={query} />}
      </div>

      <ContextMenu
        isOpen={menuPosition !== null}
        position={menuPosition ?? { x: 0, y: 0 }}
        items={menuItems}
        onClose={closeMenu}
      />
    </>
  );
}
