import { MagnifyingGlass, TextAa, Calendar, Database, ArrowUp, ArrowDown } from '@phosphor-icons/react';
import { ViewToggle } from '../../ui/ViewToggle';
import { useUIStore } from '@/stores';
import type { SkillListHeaderProps } from './types';
import styles from './SkillList.module.scss';

export function SkillListHeader({
  title,
  count,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onToggleSortDirection,
  actions,
  showViewToggle = true,
}: SkillListHeaderProps): React.ReactElement {
  const { viewMode, setViewMode } = useUIStore();

  return (
    <header className={styles.header}>
      <div className={styles.titleSection}>
        <h1 className={styles.title}>{title}</h1>
        <span className={styles.count}>{count} skills</span>
      </div>
      <div className={styles.actions}>
        <div className={styles.searchWrapper}>
          <MagnifyingGlass size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Filter skills..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.searchInput}
            spellCheck={false}
            autoComplete="off"
            data-testid="search-input"
          />
        </div>
        {showViewToggle && (
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
        )}
        <button
          type="button"
          className={styles.sortButton}
          onClick={onToggleSortDirection}
          title={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
        >
          {sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
        </button>
        <button
          type="button"
          className={[styles.sortOptionButton, sortBy === 'name' && styles.active].filter(Boolean).join(' ')}
          onClick={() => onSortByChange('name')}
          title="Sort by name"
        >
          <TextAa size={16} />
        </button>
        <button
          type="button"
          className={[styles.sortOptionButton, sortBy === 'date' && styles.active].filter(Boolean).join(' ')}
          onClick={() => onSortByChange('date')}
          title="Sort by date"
        >
          <Calendar size={16} />
        </button>
        <button
          type="button"
          className={[styles.sortOptionButton, sortBy === 'size' && styles.active].filter(Boolean).join(' ')}
          onClick={() => onSortByChange('size')}
          title="Sort by size"
        >
          <Database size={16} />
        </button>
        {actions}
      </div>
    </header>
  );
}
