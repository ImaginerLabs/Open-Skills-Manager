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

// Icon components for rendering at different sizes
const ICON_COMPONENTS = {
  folder: FolderSimple,
  code: Code,
  wrench: Wrench,
  lightning: Lightning,
  rocket: Rocket,
  book: Book,
  gear: Gear,
  star: Star,
  heart: Heart,
  globe: Globe,
  database: Database,
  cloud: Cloud,
  terminal: Terminal,
  search: MagnifyingGlass,
  cube: Cube,
};

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

/**
 * Get icon component by name with specified size
 */
export function getIconByName(iconName: string | undefined, size: number = 16): ReactNode {
  if (!iconName) return null;

  const IconComponent = ICON_COMPONENTS[iconName as keyof typeof ICON_COMPONENTS];
  if (IconComponent) {
    return <IconComponent size={size} />;
  }
  return null;
}

/**
 * Get a deterministic default icon based on a seed string (e.g., item id or name)
 * This ensures the same item always gets the same default icon
 */
export function getDefaultIcon(seed: string, size: number = 16): ReactNode {
  // Generate a simple hash from the seed string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Use absolute value and modulo to get an index
  const index = Math.abs(hash) % ICON_OPTIONS.length;
  const iconName = ICON_OPTIONS[index]?.name;

  if (!iconName) return null;
  return getIconByName(iconName, size);
}

/**
 * Get icon for display, with fallback to default icon if not specified
 */
export function getIconWithDefault(
  iconName: string | undefined,
  seed: string,
  size: number = 16
): ReactNode {
  const icon = getIconByName(iconName, size);
  if (icon) return icon;
  return getDefaultIcon(seed, size);
}
