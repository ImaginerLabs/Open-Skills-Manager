import type { LibrarySkill } from '@/stores/libraryStore';
import type { GlobalSkill } from '@/stores/globalStore';
import type { ProjectSkill } from '@/stores/projectStore';

export type Skill = LibrarySkill | GlobalSkill | ProjectSkill;

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

export interface SkillListProps<T extends Skill> {
  skills: T[];
  selectedSkillId?: string | undefined;
  onSelect: (skill: T) => void;
  onGetSkillId: (skill: T) => string;
  renderCard: (skill: T, isSelected: boolean) => React.ReactNode;
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
  renderCard: (skill: T, isSelected: boolean) => React.ReactNode;
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
