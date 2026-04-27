import { useState, useRef, useEffect } from 'react';
import { CaretDown, Check, FolderOpen } from '@phosphor-icons/react';
import { libraryService } from '../../../services/libraryService';
import type { Category } from '../../../stores/libraryStore';
import styles from './SearchOverlay.module.scss';

export interface CategoryFilterProps {
  value: string | null;
  onChange: (categoryId: string | null) => void;
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps): React.ReactElement {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true);
      try {
        const result = await libraryService.categories.list();
        if (result.success) {
          setCategories(result.data);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && categories.length === 0) {
      loadCategories();
    }
  }, [isOpen, categories.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCategory = value ? categories.find((c) => c.id === value) : null;

  const handleSelect = (categoryId: string | null) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  const count = (category: Category): number => {
    return category.skillCount ?? 0;
  };

  return (
    <div className={styles.categoryFilter} ref={dropdownRef}>
      <button
        type="button"
        className={styles.selectorButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={isLoading}
      >
        <FolderOpen size={14} />
        <span>{selectedCategory?.name ?? 'All Categories'}</span>
        <CaretDown size={12} className={styles.caret} />
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          <button
            type="button"
            className={styles.dropdownItem}
            onClick={() => handleSelect(null)}
            role="option"
            aria-selected={value === null}
          >
            <FolderOpen size={14} />
            <span>All Categories</span>
            {value === null && <Check size={14} className={styles.checkIcon} />}
          </button>

          {categories.length > 0 && (
            <>
              <div className={styles.dropdownDivider} />
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => handleSelect(category.id)}
                  role="option"
                  aria-selected={value === category.id}
                >
                  <span>{category.name}</span>
                  <span className={styles.count}>({count(category)})</span>
                  {value === category.id && <Check size={14} className={styles.checkIcon} />}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
