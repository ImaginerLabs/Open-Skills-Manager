import { useState, useRef, useEffect, useCallback } from 'react';
import { SquaresFour, Globe, Folder, Export, Copy, Trash, ArrowSquareOut } from '@phosphor-icons/react';
import type { SearchResult } from '../../../stores/uiStore';
import styles from './SearchOverlay.module.scss';

export interface SearchResultCardProps {
  result: SearchResult;
  query: string;
  onDeploy?: ((result: SearchResult) => void) | undefined;
  onExport?: ((result: SearchResult) => void) | undefined;
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
  onDeploy,
  onExport,
  onCopyPath,
  onDelete,
}: SearchResultCardProps): React.ReactElement {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu && !event.defaultPrevented) {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

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

      {contextMenu && (
        <>
          <div className={styles.contextOverlay} onClick={() => setContextMenu(null)} />
          <div
            className={styles.contextMenu}
            style={{ left: contextMenu.x, top: contextMenu.y }}
            role="menu"
          >
            {onDeploy && (
              <button
                type="button"
                className={styles.contextMenuItem}
                onClick={() => {
                  onDeploy(result);
                  setContextMenu(null);
                }}
                role="menuitem"
              >
                <ArrowSquareOut size={14} />
                <span>Deploy</span>
              </button>
            )}
            {onExport && (
              <button
                type="button"
                className={styles.contextMenuItem}
                onClick={() => {
                  onExport(result);
                  setContextMenu(null);
                }}
                role="menuitem"
              >
                <Export size={14} />
                <span>Export</span>
              </button>
            )}
            {onCopyPath && (
              <button
                type="button"
                className={styles.contextMenuItem}
                onClick={() => {
                  onCopyPath(result);
                  setContextMenu(null);
                }}
                role="menuitem"
              >
                <Copy size={14} />
                <span>Copy Path</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className={[styles.contextMenuItem, styles.danger].filter(Boolean).join(' ')}
                onClick={() => {
                  onDelete(result);
                  setContextMenu(null);
                }}
                role="menuitem"
              >
                <Trash size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
