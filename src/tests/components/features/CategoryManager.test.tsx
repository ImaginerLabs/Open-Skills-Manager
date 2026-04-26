import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryManager } from '@/components/features/CategoryManager/CategoryManager';
import type { Category } from '@/stores/libraryStore';

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
    icon: 'icon',
    name: 'name',
    count: 'count',
    menuButton: 'menuButton',
    groups: 'groups',
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

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Development',
    icon: 'code',
    color: '#4A90D9',
    groups: [
      {
        id: 'grp-1',
        categoryId: 'cat-1',
        name: 'Frontend',
        skillCount: 5,
        isCustom: true,
        createdAt: new Date(),
      },
      {
        id: 'grp-2',
        categoryId: 'cat-1',
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
    id: 'cat-2',
    name: 'Testing',
    groups: [],
    skillCount: 4,
    isCustom: true,
    createdAt: new Date(),
  },
];

describe('CategoryManager', () => {
  const defaultProps = {
    categories: mockCategories,
    selectedCategoryId: undefined,
    selectedGroupId: undefined,
    onSelectCategory: vi.fn(),
    onSelectGroup: vi.fn(),
    onCreateCategory: vi.fn(),
    onRenameCategory: vi.fn(),
    onDeleteCategory: vi.fn(),
    onCreateGroup: vi.fn(),
    onRenameGroup: vi.fn(),
    onDeleteGroup: vi.fn(),
    onOrganizeSkill: vi.fn(),
    totalSkillsCount: 12,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render categories list', () => {
      render(<CategoryManager {...defaultProps} />);
      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.getByText('Testing')).toBeInTheDocument();
    });

    it('should render header title', () => {
      render(<CategoryManager {...defaultProps} />);
      expect(screen.getByText('Categories')).toBeInTheDocument();
    });

    it('should render add category button', () => {
      render(<CategoryManager {...defaultProps} />);
      expect(screen.getByLabelText('Create category')).toBeInTheDocument();
    });

    it('should render empty state when no categories', () => {
      render(<CategoryManager {...defaultProps} categories={[]} />);
      expect(screen.getByText('No categories yet')).toBeInTheDocument();
    });

    it('should render skill counts', () => {
      render(<CategoryManager {...defaultProps} />);
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('category CRUD operations', () => {
    it('should call onCreateCategory when creating new category', async () => {
      const onCreateCategory = vi.fn();
      render(<CategoryManager {...defaultProps} onCreateCategory={onCreateCategory} />);

      const addButton = screen.getByLabelText('Create category');
      fireEvent.click(addButton);

      const input = screen.getByPlaceholderText('Category name');
      fireEvent.change(input, { target: { value: 'New Category' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onCreateCategory).toHaveBeenCalledWith('New Category');
    });

    it('should not create category with empty name', async () => {
      const onCreateCategory = vi.fn();
      render(<CategoryManager {...defaultProps} onCreateCategory={onCreateCategory} />);

      const addButton = screen.getByLabelText('Create category');
      fireEvent.click(addButton);

      const input = screen.getByPlaceholderText('Category name');
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onCreateCategory).not.toHaveBeenCalled();
    });

    it('should call onSelectCategory when clicking category', async () => {
      const onSelectCategory = vi.fn();
      render(<CategoryManager {...defaultProps} onSelectCategory={onSelectCategory} />);

      const categoryItem = screen.getByText('Testing');
      fireEvent.click(categoryItem);

      expect(onSelectCategory).toHaveBeenCalledWith('cat-2');
    });

    it('should expand category on first click', async () => {
      render(<CategoryManager {...defaultProps} />);

      const categoryItem = screen.getByText('Development');
      fireEvent.click(categoryItem);

      expect(screen.getByText('Frontend')).toBeInTheDocument();
      expect(screen.getByText('Backend')).toBeInTheDocument();
    });
  });

  describe('group CRUD operations', () => {
    it('should show add group button when category is expanded', async () => {
      render(<CategoryManager {...defaultProps} />);

      const categoryItem = screen.getByText('Development');
      fireEvent.click(categoryItem);

      expect(screen.getByText('Add group')).toBeInTheDocument();
    });

    it('should call onCreateGroup when creating new group', async () => {
      const onCreateGroup = vi.fn();
      render(<CategoryManager {...defaultProps} onCreateGroup={onCreateGroup} />);

      const categoryItem = screen.getByText('Development');
      fireEvent.click(categoryItem);

      const addGroupButton = screen.getByText('Add group');
      fireEvent.click(addGroupButton);

      const input = screen.getByPlaceholderText('Group name');
      fireEvent.change(input, { target: { value: 'DevOps' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onCreateGroup).toHaveBeenCalledWith('cat-1', 'DevOps');
    });

    it('should call onSelectGroup when clicking group', async () => {
      const onSelectGroup = vi.fn();
      render(<CategoryManager {...defaultProps} onSelectGroup={onSelectGroup} />);

      const categoryItem = screen.getByText('Development');
      fireEvent.click(categoryItem);

      const groupItem = screen.getByText('Frontend');
      fireEvent.click(groupItem);

      expect(onSelectGroup).toHaveBeenCalledWith('cat-1', 'grp-1');
    });
  });

  describe('context menu actions', () => {
    it('should show context menu on right-click', async () => {
      render(<CategoryManager {...defaultProps} />);

      const categoryItem = screen.getByText('Testing');
      fireEvent.contextMenu(categoryItem);

      expect(screen.getByText('Rename')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should call onDeleteCategory when deleting from context menu', async () => {
      const onDeleteCategory = vi.fn();
      render(<CategoryManager {...defaultProps} onDeleteCategory={onDeleteCategory} />);

      const categoryItem = screen.getByText('Testing');
      fireEvent.contextMenu(categoryItem);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(onDeleteCategory).toHaveBeenCalledWith('cat-2');
    });

    it('should close context menu when clicking overlay', async () => {
      render(<CategoryManager {...defaultProps} />);

      const categoryItem = screen.getByText('Testing');
      fireEvent.contextMenu(categoryItem);

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

      const categoryItem = screen.getByText('Testing');
      fireEvent.contextMenu(categoryItem);

      const renameButton = screen.getByText('Rename');
      fireEvent.click(renameButton);

      expect(screen.getByPlaceholderText('Category name')).toBeInTheDocument();
    });

    it('should show inline edit input with current value when renaming', async () => {
      render(<CategoryManager {...defaultProps} />);

      const categoryItem = screen.getByText('Testing');
      fireEvent.contextMenu(categoryItem);

      const renameButton = screen.getByText('Rename');
      fireEvent.click(renameButton);

      const input = screen.getByPlaceholderText('Category name');
      expect(input).toBeInTheDocument();
      // Input should have the current category name as initial value
      expect(input).toHaveValue('Testing');
    });

    it('should cancel editing on Escape key', async () => {
      render(<CategoryManager {...defaultProps} />);

      const categoryItem = screen.getByText('Testing');
      fireEvent.contextMenu(categoryItem);

      const renameButton = screen.getByText('Rename');
      fireEvent.click(renameButton);

      const input = screen.getByPlaceholderText('Category name');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(screen.queryByPlaceholderText('Category name')).not.toBeInTheDocument();
    });
  });

  describe('selection state', () => {
    it('should highlight selected category', async () => {
      render(<CategoryManager {...defaultProps} selectedCategoryId="cat-2" />);

      const testingCategory = screen.getByText('Testing');
      expect(testingCategory.closest('.selected')).toBeTruthy();
    });

    it('should highlight selected group', async () => {
      render(
        <CategoryManager
          {...defaultProps}
          selectedCategoryId="cat-1"
          selectedGroupId="grp-1"
        />
      );

      const categoryItem = screen.getByText('Development');
      fireEvent.click(categoryItem);

      const frontendGroup = screen.getByText('Frontend');
      expect(frontendGroup.closest('.selected')).toBeTruthy();
    });
  });
});