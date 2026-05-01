import type { LibrarySkill } from '@/stores/libraryStore';
import type { GlobalSkill } from '@/stores/globalStore';
import type { ProjectSkill } from '@/stores/projectStore';

export type Skill = LibrarySkill | GlobalSkill | ProjectSkill;
export type SkillScope = 'library' | 'global' | 'project';
export type ViewMode = 'grid' | 'list';

export type SortOption = 'name' | 'date' | 'size';
export type SortDirection = 'asc' | 'desc';

export interface SkillListLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string | undefined;
}

export interface SkillListHeaderProps {
  title: string;
  count: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortByChange: (option: SortOption) => void;
  sortDirection: SortDirection;
  onToggleSortDirection: () => void;
  actions?: React.ReactNode;
  showViewToggle?: boolean;
}

export interface SkillCardActions<T extends Skill> {
  onDelete?: (skillId: string) => void;
  onExport?: (skill: T) => void;
  onDeploy?: (skill: T) => void;
  onCopyPath?: (skillId: string) => void;
  onReveal?: (skillId: string) => void;
  onDragStart?: (skill: T) => void;
  onDragEnd?: (skill: T) => void;
}

export interface SkillListProps<T extends Skill> {
  skills: T[];
  selectedSkillId?: string | undefined;
  onSelect: (skill: T) => void;
  onGetSkillId: (skill: T) => string;
  scope: SkillScope;
  actions?: SkillCardActions<T> | undefined;
  isLoading?: boolean | undefined;
  emptyIcon?: React.ReactNode | undefined;
  emptyTitle: string;
  emptyText: string;
  hasSkills: boolean;
  onSkillClick?: ((skill: T) => void) | undefined;
  /** Search query for highlighting matches in skill cards */
  searchQuery?: string | undefined;
}

export interface SkillListItemProps<T extends Skill> {
  skill: T;
  isSelected: boolean;
  onSelect: (skill: T) => void;
  scope: SkillScope;
  actions?: SkillCardActions<T> | undefined;
  animationDelay?: number | undefined;
  viewMode?: ViewMode | undefined;
  onClick?: (() => void) | undefined;
  /** Search query for highlighting matches in skill cards */
  searchQuery?: string | undefined;
}

export interface SkillDetailPanelProps {
  isOpen: boolean;
  children: React.ReactNode;
  onClose: () => void;
}

export interface UseSkillSortResult<T> {
  sortedSkills: T[];
  sortBy: SortOption;
  setSortBy: (option: SortOption) => void;
  sortDirection: SortDirection;
  toggleSortDirection: () => void;
}

/**
 * Scope badge configuration for displaying source labels
 */
export interface ScopeBadgeConfig {
  /** Whether to show the scope badge */
  show: boolean;
  /** Optional override for the scope (useful for search results) */
  scope?: SkillScope;
}
