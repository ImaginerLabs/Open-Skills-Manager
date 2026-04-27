import { SquaresFour, List } from '@phosphor-icons/react';
import styles from './ViewToggle.module.scss';

export interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onChange: (mode: 'grid' | 'list') => void;
}

export function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
  return (
    <div className={styles.container} role="group" aria-label="View mode toggle">
      <button
        className={`${styles.button} ${viewMode === 'grid' ? styles.active : ''}`}
        onClick={() => onChange('grid')}
        aria-pressed={viewMode === 'grid'}
        aria-label="Grid view"
        type="button"
      >
        <SquaresFour size={18} weight={viewMode === 'grid' ? 'fill' : 'regular'} />
      </button>
      <button
        className={`${styles.button} ${viewMode === 'list' ? styles.active : ''}`}
        onClick={() => onChange('list')}
        aria-pressed={viewMode === 'list'}
        aria-label="List view"
        type="button"
      >
        <List size={18} weight={viewMode === 'list' ? 'fill' : 'regular'} />
      </button>
    </div>
  );
}