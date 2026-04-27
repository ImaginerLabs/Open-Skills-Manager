import type { LibrarySkill } from '@/stores/libraryStore';
import type { GlobalSkill } from '@/stores/globalStore';
import type { ProjectSkill } from '@/stores/projectStore';

export type Skill = LibrarySkill | GlobalSkill | ProjectSkill;
export type SkillScope = 'library' | 'global' | 'project';

export type SortOption = 'name' | 'date' | 'size';
export type SortDirection = 'asc' | 'desc';

export interface SkillListLayoutProps {
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
}

export interface SkillCardActions<T extends Skill> {
  onDelete?: (skillId: string) => void;
  onExport?: (skillId: string) => void;
  onDeploy?: (skill: T) => void;
  onPull?: (skillId: string) => void;
  onDragStart?: (skill: T) => void;
  onDragEnd?: (skill: T) => void;
}

export interface SkillListProps<T extends Skill> {
  skills: T[];
  selectedSkillId?: string | undefined;
  onSelect: (skill: T) => void;
  onGetSkillId: (skill: T) => string;
  scope: SkillScope;
  actions?: SkillCardActions<T>;
  isLoading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyTitle: string;
  emptyText: string;
  hasSkills: boolean;
}

export interface SkillListItemProps<T extends Skill> {
  skill: T;
  isSelected: boolean;
  onSelect: (skill: T) => void;
  scope: SkillScope;
  actions?: SkillCardActions<T> | undefined;
  animationDelay?: number;
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
