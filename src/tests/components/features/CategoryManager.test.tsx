import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryManager } from '@/components/features/CategoryManager/CategoryManager';
import type { Group } from '@/stores/libraryStore';

// Mock the drag-drop hook
vi.mock('@/hooks/useCategoryDragDrop', () => ({
  useCategoryDragDrop: vi.fn(() => ({
    dragOverState: null,
    handleDragOver: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDrop: vi.fn(),
  })),
}));

// Mock CSS modules
vi.mock('@/components/features/CategoryManager/CategoryManager.module.scss', () => ({
  default: {
    container: 'container',
    header: 'header',
    title: 'title',
    addButton: 'addButton',
    list: 'list',
    categoryWrapper: 'categoryWrapper',
    categoryItem: 'categoryItem',
    selected: 'selected',
    dragOver: 'dragOver',
    expandIcon: 'expandIcon',
    expanded: 'expanded',
    icon: 'icon',
    name: 'name',
    count: 'count',
    menuButton: 'menuButton',
    groups: 'groups',
    groupsCollapsed: 'groupsCollapsed',
    groupsInner: 'groupsInner',
    groupItem: 'groupItem',
    addGroupButton: 'addGroupButton',
    emptyText: 'emptyText',
  },
}));

vi.mock('@/components/features/CategoryManager/InlineEditInput.module.scss', () => ({
  default: {
    inlineInput: 'inlineInput',
    indented: 'indented',
  },
}));

vi.mock('@/components/features/CategoryManager/ContextMenu.module.scss', () => ({
  default: {
    contextOverlay: 'contextOverlay',
    contextMenu: 'contextMenu',
    menuItem: 'menuItem',
    danger: 'danger',
  },
}));

const mockGroups: Group[] = [
  {
    id: 'grp-1',
    name: 'Development',
    icon: 'code',
    color: '#4A90D9',
    categories: [
      {
        id: 'cat-1',
        groupId: 'grp-1',
        name: 'Frontend',
        skillCount: 5,
        isCustom: true,
        createdAt: new Date(),
      },
      {
        id: 'cat-2',
        groupId: 'grp-1',
        name: 'Backend',
        skillCount: 3,
        isCustom: true,
        createdAt: new Date(),
      },
    ],
    skillCount: 8,
    isCustom: true,
    createdAt: new Date(),
  },
  {
    id: 'grp-2',
    name: 'Testing',
    categories: [],
    skillCount: 4,
    isCustom: true,
    createdAt: new Date(),
  },
];

describe('CategoryManager', () => {
  const defaultProps = {
    groups: mockGroups,
    selectedGroupId: undefined,
    selectedCategoryId: undefined,
    onSelectGroup: vi.fn(),
    onSelectCategory: vi.fn(),
    onCreateGroup: vi.fn(),
    onRenameGroup: vi.fn(),
    onDeleteGroup: vi.fn(),
    onCreateCategory: vi.fn(),
    onRenameCategory: vi.fn(),
    onDeleteCategory: vi.fn(),
    onOrganizeSkill: vi.fn(),
    totalSkillsCount: 12,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render groups list', () => {
      render(<CategoryManager {...defaultProps} />);
      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.getByText('Testing')).toBeInTheDocument();
    });

    it('should render header title', () => {
      render(<CategoryManager {...defaultProps} />);
      expect(screen.getByText('Groups')).toBeInTheDocument();
    });

    it('should render add group button', () => {
      render(<CategoryManager {...defaultProps} />);
      expect(screen.getByLabelText('Create group')).toBeInTheDocument();
    });

    it('should render empty state when no groups', () => {
      render(<CategoryManager {...defaultProps} groups={[]} />);
      expect(screen.getByText('No groups yet')).toBeInTheDocument();
    });

    it('should render skill counts', () => {
      render(<CategoryManager {...defaultProps} />);
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('group CRUD operations', () => {
    it('should call onCreateGroup when creating new group', async () => {
      const onCreateGroup = vi.fn();
      render(<CategoryManager {...defaultProps} onCreateGroup={onCreateGroup} />);

      const addButton = screen.getByLabelText('Create group');
      fireEvent.click(addButton);

      const input = screen.getByPlaceholderText('Group name');
      fireEvent.change(input, { target: { value: 'New Group' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onCreateGroup).toHaveBeenCalledWith('New Group');
    });

    it('should not create group with empty name', async () => {
      const onCreateGroup = vi.fn();
      render(<CategoryManager {...defaultProps} onCreateGroup={onCreateGroup} />);

      const addButton = screen.getByLabelText('Create group');
      fireEvent.click(addButton);

      const input = screen.getByPlaceholderText('Group name');
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onCreateGroup).not.toHaveBeenCalled();
    });

    it('should call onSelectGroup when clicking group', async () => {
      const onSelectGroup = vi.fn();
      render(<CategoryManager {...defaultProps} onSelectGroup={onSelectGroup} />);

      const groupItem = screen.getByText('Testing');
      fireEvent.click(groupItem);

      expect(onSelectGroup).toHaveBeenCalledWith('grp-2');
    });

    it('should expand group on first click', async () => {
      render(<CategoryManager {...defaultProps} />);

      const groupItem = screen.getByText('Development');
      fireEvent.click(groupItem);

      expect(screen.getByText('Frontend')).toBeInTheDocument();
      expect(screen.getByText('Backend')).toBeInTheDocument();
    });
  });

  describe('category CRUD operations', () => {
    it('should show add category button when group is expanded', async () => {
      render(<CategoryManager {...defaultProps} />);

      const groupItem = screen.getByText('Development');
      fireEvent.click(groupItem);

      const addCategoryButtons = screen.getAllByText('Add category');
      const visibleAddCategoryButton = addCategoryButtons.find(
        (btn) => !btn.closest('[aria-hidden="true"]')
      );
      expect(visibleAddCategoryButton).toBeInTheDocument();
    });

    it('should call onCreateCategory when creating new category', async () => {
      const onCreateCategory = vi.fn();
      render(<CategoryManager {...defaultProps} onCreateCategory={onCreateCategory} />);

      const groupItem = screen.getByText('Development');
      fireEvent.click(groupItem);

      const addCategoryButtons = screen.getAllByText('Add category');
      const visibleAddCategoryButton = addCategoryButtons.find(
        (btn) => !btn.closest('[aria-hidden="true"]')
      );
      fireEvent.click(visibleAddCategoryButton!);

      const input = screen.getByPlaceholderText('Category name');
      fireEvent.change(input, { target: { value: 'DevOps' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onCreateCategory).toHaveBeenCalledWith('grp-1', 'DevOps');
    });

    it('should call onSelectCategory when clicking category', async () => {
      const onSelectCategory = vi.fn();
      render(<CategoryManager {...defaultProps} onSelectCategory={onSelectCategory} />);

      const groupItem = screen.getByText('Development');
      fireEvent.click(groupItem);

      const categoryItem = screen.getByText('Frontend');
      fireEvent.click(categoryItem);

      expect(onSelectCategory).toHaveBeenCalledWith('grp-1', 'cat-1');
    });
  });

  describe('context menu actions', () => {
    it('should show context menu on right-click', async () => {
      render(<CategoryManager {...defaultProps} />);

      const groupItem = screen.getByText('Testing');
      fireEvent.contextMenu(groupItem);

      expect(screen.getByText('Rename')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should call onDeleteGroup when deleting from context menu', async () => {
      const onDeleteGroup = vi.fn();
      render(<CategoryManager {...defaultProps} onDeleteGroup={onDeleteGroup} />);

      const groupItem = screen.getByText('Testing');
      fireEvent.contextMenu(groupItem);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(onDeleteGroup).toHaveBeenCalledWith('grp-2');
    });

    it('should close context menu when clicking overlay', async () => {
      render(<CategoryManager {...defaultProps} />);

      const groupItem = screen.getByText('Testing');
      fireEvent.contextMenu(groupItem);

      const overlay = document.querySelector('.contextOverlay');
      if (overlay) {
        fireEvent.click(overlay);
      }

      expect(screen.queryByText('Rename')).not.toBeInTheDocument();
    });
  });

  describe('inline editing', () => {
    it('should show inline edit input when renaming', async () => {
      render(<CategoryManager {...defaultProps} />);

      const groupItem = screen.getByText('Testing');
      fireEvent.contextMenu(groupItem);

      const renameButton = screen.getByText('Rename');
      fireEvent.click(renameButton);

      expect(screen.getByPlaceholderText('Group name')).toBeInTheDocument();
    });

    it('should show inline edit input with current value when renaming', async () => {
      render(<CategoryManager {...defaultProps} />);

      const groupItem = screen.getByText('Testing');
      fireEvent.contextMenu(groupItem);

      const renameButton = screen.getByText('Rename');
      fireEvent.click(renameButton);

      const input = screen.getByPlaceholderText('Group name');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Testing');
    });

    it('should cancel editing on Escape key', async () => {
      render(<CategoryManager {...defaultProps} />);

      const groupItem = screen.getByText('Testing');
      fireEvent.contextMenu(groupItem);

      const renameButton = screen.getByText('Rename');
      fireEvent.click(renameButton);

      const input = screen.getByPlaceholderText('Group name');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(screen.queryByPlaceholderText('Group name')).not.toBeInTheDocument();
    });
  });

  describe('selection state', () => {
    it('should highlight selected group', async () => {
      render(<CategoryManager {...defaultProps} selectedGroupId="grp-2" />);

      const testingGroup = screen.getByText('Testing');
      expect(testingGroup.closest('.selected')).toBeTruthy();
    });

    it('should highlight selected category', async () => {
      render(
        <CategoryManager
          {...defaultProps}
          selectedGroupId="grp-1"
          selectedCategoryId="cat-1"
        />
      );

      const groupItem = screen.getByText('Development');
      fireEvent.click(groupItem);

      const frontendCategory = screen.getByText('Frontend');
      expect(frontendCategory.closest('.selected')).toBeTruthy();
    });
  });
});