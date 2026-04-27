import { useState, useRef, useEffect } from 'react';
import { CaretDown, Check, Globe, Folder, SquaresFour } from '@phosphor-icons/react';
import { useProjectStore } from '../../../stores/projectStore';
import styles from './SearchOverlay.module.scss';

export interface ScopeSelectorProps {
  value: 'all' | 'library' | 'global' | 'project';
  selectedProjectId: string | null;
  onScopeChange: (scope: 'all' | 'library' | 'global' | 'project') => void;
  onProjectChange: (projectId: string | null) => void;
}

export function ScopeSelector({
  value,
  selectedProjectId,
  onScopeChange,
  onProjectChange,
}: ScopeSelectorProps): React.ReactElement {
  const { projects } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getScopeLabel = () => {
    switch (value) {
      case 'all':
        return 'All Scopes';
      case 'library':
        return 'App Library';
      case 'global':
        return 'Global Skills';
      case 'project':
        if (selectedProjectId) {
          const project = projects.find((p) => p.id === selectedProjectId);
          return project ? project.name : 'Select Project';
        }
        return 'Select Project';
      default:
        return 'All Scopes';
    }
  };

  const handleScopeSelect = (scope: 'all' | 'library' | 'global' | 'project') => {
    onScopeChange(scope);
    if (scope !== 'project') {
      onProjectChange(null);
    }
    setIsOpen(false);
  };

  const handleProjectSelect = (projectId: string) => {
    onScopeChange('project');
    onProjectChange(projectId);
    setIsOpen(false);
  };

  return (
    <div className={styles.scopeSelector} ref={dropdownRef}>
      <button
        type="button"
        className={styles.selectorButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {value === 'library' && <SquaresFour size={14} />}
        {value === 'global' && <Globe size={14} />}
        {value === 'project' && <Folder size={14} />}
        {value === 'all' && <SquaresFour size={14} />}
        <span>{getScopeLabel()}</span>
        <CaretDown size={12} className={styles.caret} />
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.dropdownSection}>
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={() => handleScopeSelect('all')}
              role="option"
              aria-selected={value === 'all'}
            >
              <SquaresFour size={14} />
              <span>All Scopes</span>
              {value === 'all' && <Check size={14} className={styles.checkIcon} />}
            </button>
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={() => handleScopeSelect('library')}
              role="option"
              aria-selected={value === 'library'}
            >
              <SquaresFour size={14} />
              <span>App Library</span>
              {value === 'library' && <Check size={14} className={styles.checkIcon} />}
            </button>
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={() => handleScopeSelect('global')}
              role="option"
              aria-selected={value === 'global'}
            >
              <Globe size={14} />
              <span>Global Skills</span>
              {value === 'global' && <Check size={14} className={styles.checkIcon} />}
            </button>
          </div>

          {projects.length > 0 && (
            <>
              <div className={styles.dropdownDivider} />
              <div className={styles.dropdownSection}>
                <div className={styles.sectionLabel}>Projects</div>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => handleProjectSelect(project.id)}
                    role="option"
                    aria-selected={value === 'project' && selectedProjectId === project.id}
                  >
                    <Folder size={14} />
                    <span className={styles.projectName}>{project.name}</span>
                    <span className={styles.statusDot} data-exists={project.exists} />
                    {value === 'project' && selectedProjectId === project.id && (
                      <Check size={14} className={styles.checkIcon} />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
