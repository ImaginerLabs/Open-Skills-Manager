import { useState, useRef, useEffect } from 'react';
import { CaretDown, Check, FolderOpen } from '@phosphor-icons/react';
import { libraryService } from '../../../services/libraryService';
import type { Group } from '../../../stores/libraryStore';
import styles from './SearchOverlay.module.scss';

export interface CategoryFilterProps {
  value: string | null;
  onChange: (groupId: string | null) => void;
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps): React.ReactElement {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true);
      try {
        const result = await libraryService.groups.list();
        if (result.success) {
          setGroups(result.data);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && groups.length === 0) {
      loadGroups();
    }
  }, [isOpen, groups.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedGroup = value ? groups.find((g) => g.id === value) : null;

  const handleSelect = (groupId: string | null) => {
    onChange(groupId);
    setIsOpen(false);
  };

  const count = (group: Group): number => {
    return group.skillCount ?? 0;
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
        <span>{selectedGroup?.name ?? 'All Groups'}</span>
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
            <span>All Groups</span>
            {value === null && <Check size={14} className={styles.checkIcon} />}
          </button>

          {groups.length > 0 && (
            <>
              <div className={styles.dropdownDivider} />
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => handleSelect(group.id)}
                  role="option"
                  aria-selected={value === group.id}
                >
                  <span>{group.name}</span>
                  <span className={styles.count}>({count(group)})</span>
                  {value === group.id && <Check size={14} className={styles.checkIcon} />}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}