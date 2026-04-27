import { useEffect, useRef } from 'react';
import { MagnifyingGlass, X, Spinner } from '@phosphor-icons/react';
import styles from './SearchOverlay.module.scss';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  isLoading,
  placeholder = 'Search skills...',
}: SearchInputProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={styles.searchInputWrapper}>
      <MagnifyingGlass size={18} className={styles.searchIcon} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.searchInput}
        aria-label="Search skills"
      />
      {isLoading && <Spinner size={16} className={styles.loadingIcon} />}
      {value && !isLoading && (
        <button
          type="button"
          onClick={handleClear}
          className={styles.clearButton}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
