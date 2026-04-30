import { SquaresFour, Globe, Folder, CaretDown } from '@phosphor-icons/react';
import type { SearchResult } from '../../../stores/uiStore';
import { SearchResultCard } from './SearchResultCard';
import styles from './SearchOverlay.module.scss';

export interface SearchResultGroupProps {
  groupId: string;
  title: string;
  results: SearchResult[];
  query: string;
  scope: 'library' | 'global' | 'project';
  isCollapsed: boolean;
  onToggleCollapse: (groupId: string) => void;
  onClick?: ((result: SearchResult) => void) | undefined;
  onDeploy?: ((result: SearchResult) => void) | undefined;
  onExport?: ((result: SearchResult) => void) | undefined;
  onCopyPath?: ((result: SearchResult) => void) | undefined;
  onReveal?: ((result: SearchResult) => void) | undefined;
  onDelete?: ((result: SearchResult) => void) | undefined;
}

const SCOPE_ICONS = {
  library: SquaresFour,
  global: Globe,
  project: Folder,
};

const SCOPE_COLORS = {
  library: '#0A84FF',
  global: '#30D158',
  project: '#FF9F0A',
};

export function SearchResultGroup({
  groupId,
  title,
  results,
  query,
  scope,
  isCollapsed,
  onToggleCollapse,
  onClick,
  onDeploy,
  onExport,
  onCopyPath,
  onReveal,
  onDelete,
}: SearchResultGroupProps): React.ReactElement {
  const ScopeIcon = SCOPE_ICONS[scope];
  const count = results.length;

  return (
    <div className={styles.resultGroup}>
      <button
        type="button"
        className={styles.groupHeader}
        onClick={() => onToggleCollapse(groupId)}
        aria-expanded={!isCollapsed}
      >
        <ScopeIcon size={16} style={{ color: SCOPE_COLORS[scope] }} />
        <span className={styles.groupTitle}>{title}</span>
        <span className={styles.countBadge}>{count}</span>
        <CaretDown
          size={14}
          className={[styles.groupCaret, isCollapsed && styles.collapsed].filter(Boolean).join(' ')}
        />
      </button>

      {!isCollapsed && (
        <div className={styles.groupResults}>
          {results.map((result) => (
            <div key={result.id} className={styles.resultItem}>
              <SearchResultCard
                result={result}
                query={query}
                onClick={onClick}
                onDeploy={onDeploy}
                onExport={onExport}
                onCopyPath={onCopyPath}
                onReveal={onReveal}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
