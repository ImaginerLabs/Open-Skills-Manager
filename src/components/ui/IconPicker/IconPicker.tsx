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
import WindsurfAvatar from '@lobehub/icons/es/Windsurf/components/Avatar';
import ReplitAvatar from '@lobehub/icons/es/Replit/components/Avatar';
import CopilotAvatar from '@lobehub/icons/es/Copilot/components/Avatar';
import TraeAvatar from '@lobehub/icons/es/Trae/components/Avatar';
import styles from './IconPicker.module.scss';

export interface IconOption {
  name: string;
  icon: ReactNode;
  /** Whether this is an IDE icon (uses lobehub icons) */
  isIDE?: boolean;
}

// IDE icon names for external use
export const IDE_ICONS = [
  'windsurf',
  'replit',
  'copilot',
  'trae',
] as const;

export const ICON_OPTIONS: IconOption[] = [
  // IDE Icons (using lobehub icons)
  { name: 'windsurf', icon: <WindsurfAvatar size={20} />, isIDE: true },
  { name: 'replit', icon: <ReplitAvatar size={20} />, isIDE: true },
  { name: 'copilot', icon: <CopilotAvatar size={20} />, isIDE: true },
  { name: 'trae', icon: <TraeAvatar size={20} />, isIDE: true },
  // Generic icons
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

// Phosphor icon components for rendering at different sizes
const PHOSPHOR_ICONS = {
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

// IDE Avatar components
const IDE_AVATARS: Record<string, React.ComponentType<{ size: number }>> = {
  windsurf: WindsurfAvatar,
  replit: ReplitAvatar,
  copilot: CopilotAvatar,
  trae: TraeAvatar,
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
 * Supports both Phosphor icons and IDE avatars
 */
export function getIconByName(iconName: string | undefined, size: number = 16): ReactNode {
  if (!iconName) return null;

  // Check if it's an IDE icon
  const IDEAvatar = IDE_AVATARS[iconName];
  if (IDEAvatar) {
    return <IDEAvatar size={size} />;
  }

  // Check if it's a Phosphor icon
  const PhosphorIcon = PHOSPHOR_ICONS[iconName as keyof typeof PHOSPHOR_ICONS];
  if (PhosphorIcon) {
    return <PhosphorIcon size={size} />;
  }

  return null;
}

/**
 * Check if an icon name is an IDE icon
 */
export function isIDEIcon(iconName: string): boolean {
  return iconName in IDE_AVATARS;
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
