import type { ReactNode } from 'react';
import {
  FolderSimple,
  Code,
  Wrench,
  Lightning,
  Rocket,
  Book,
  Gear,
  Star,
  Heart,
  Globe,
  Database,
  Cloud,
  Terminal,
  MagnifyingGlass,
  Cube,
} from '@phosphor-icons/react';
import styles from './IconPicker.module.scss';

export interface IconOption {
  name: string;
  icon: ReactNode;
}

export const ICON_OPTIONS: IconOption[] = [
  { name: 'folder', icon: <FolderSimple size={20} /> },
  { name: 'code', icon: <Code size={20} /> },
  { name: 'wrench', icon: <Wrench size={20} /> },
  { name: 'lightning', icon: <Lightning size={20} /> },
  { name: 'rocket', icon: <Rocket size={20} /> },
  { name: 'book', icon: <Book size={20} /> },
  { name: 'gear', icon: <Gear size={20} /> },
  { name: 'star', icon: <Star size={20} /> },
  { name: 'heart', icon: <Heart size={20} /> },
  { name: 'globe', icon: <Globe size={20} /> },
  { name: 'database', icon: <Database size={20} /> },
  { name: 'cloud', icon: <Cloud size={20} /> },
  { name: 'terminal', icon: <Terminal size={20} /> },
  { name: 'search', icon: <MagnifyingGlass size={20} /> },
  { name: 'cube', icon: <Cube size={20} /> },
];

export interface IconPickerProps {
  value?: string | undefined;
  onChange: (iconName: string) => void;
  label?: string;
}

export function IconPicker({ value, onChange, label }: IconPickerProps): React.ReactElement {
  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.grid}>
        {ICON_OPTIONS.map((option) => (
          <button
            key={option.name}
            type="button"
            className={[styles.iconButton, value === option.name && styles.selected]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange(option.name)}
            aria-label={`Select ${option.name} icon`}
            aria-pressed={value === option.name}
          >
            {option.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
