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

vi.mock('@/components/common/SidebarItem/SidebarItem.module.scss', () => ({
  default: {
    sidebarItem: 'sidebarItem',
    selected: 'selected',
    disabled: 'disabled',
    missing: 'missing',
    dragOver: 'dragOver',
    indent1: 'indent1',
    indent2: 'indent2',
    expandIcon: 'expandIcon',
    expanded: 'expanded',
    icon: 'icon',
    missingIcon: 'missingIcon',
    name: 'name',
    count: 'count',
  },
}));

// Mock CreateEntityDialog
vi.mock('@/components/common/CreateEntityDialog', () => ({
  CreateEntityDialog: ({ open, onClose, onCreate, entityType, parentName }: { open: boolean; onClose: () => void; onCreate: (name: string, icon?: string, notes?: string) => void; entityType: string; parentName?: string }) => {
    if (!open) return null;
    const testId = `create-${entityType}-dialog`;
    return (
      <div data-testid={testId} data-parent-name={parentName}>
        <input
          placeholder={`Enter ${entityType} name`}
          onChange={(e) => e.target.value}
        />
        <button onClick={() => { onCreate(`New ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`); onClose(); }}>Create</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  },
}));

// Mock common ContextMenu
vi.mock('@/components/common/ContextMenu', () => ({
  ContextMenu: ({ isOpen, items, onClose }: { isOpen: boolean; items: Array<{ id: string; label: string; onClick?: () => void; variant?: string }>; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
      <div role="menu">
        <div className="contextOverlay" onClick={onClose} />
        {items.map((item) => (
          <button
            key={item.id}
            role="menuitem"
            onClick={item.onClick}
            className={item.variant === 'danger' ? 'danger' : ''}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  },
}));

// Mock SidebarItem
vi.mock('@/components/common/SidebarItem', () => ({
  SidebarItem: ({ name, count, isSelected, onClick, onContextMenu, isEditing, editingValue, onEditSubmit, onEditCancel, expandIcon, icon, indentLevel }: {
    name: string;
    count?: number;
    isSelected?: boolean;
    onClick?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    isEditing?: boolean;
    editingValue?: string;
    onEditSubmit?: () => void;
    onEditCancel?: () => void;
    expandIcon?: React.ReactNode;
    icon?: React.ReactNode;
    indentLevel?: number;
  }) => {
    // When editing is cancelled (isEditing becomes false), don't render input
    if (isEditing) {
      return (
        <div
          data-testid={`sidebar-item-${name.toLowerCase().replace(/\s+/g, '-')}`}
          data-selected={isSelected}
          data-indent={indentLevel}
          onClick={onClick}
          onContextMenu={onContextMenu}
          role="button"
          tabIndex={0}
        >
          {expandIcon && <span data-testid="expand-icon">{expandIcon}</span>}
          {icon && <span data-testid="icon">{icon}</span>}
          <input
            data-testid="edit-input"
            placeholder="Name"
            value={editingValue}
            onChange={(e) => e.target.value}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onEditSubmit) onEditSubmit();
              if (e.key === 'Escape' && onEditCancel) onEditCancel();
            }}
          />
        </div>
      );
    }

    return (
      <div
        data-testid={`sidebar-item-${name.toLowerCase().replace(/\s+/g, '-')}`}
        data-selected={isSelected}
        data-indent={indentLevel}
        onClick={onClick}
        onContextMenu={onContextMenu}
        role="button"
        tabIndex={0}
      >
        {expandIcon && <span data-testid="expand-icon">{expandIcon}</span>}
        {icon && <span data-testid="icon">{icon}</span>}
        <span>{name}</span>
        {count !== undefined && <span>{count}</span>}
      </div>
    );
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
    it('should open create group dialog when clicking add button', async () => {
      const onCreateGroup = vi.fn();
      render(<CategoryManager {...defaultProps} onCreateGroup={onCreateGroup} />);

      const addButton = screen.getByLabelText('Create group');
      fireEvent.click(addButton);

      expect(screen.getByTestId('create-group-dialog')).toBeInTheDocument();
    });

    it('should call onCreateGroup when creating new group via dialog', async () => {
      const onCreateGroup = vi.fn();
      render(<CategoryManager {...defaultProps} onCreateGroup={onCreateGroup} />);

      const addButton = screen.getByLabelText('Create group');
      fireEvent.click(addButton);

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      expect(onCreateGroup).toHaveBeenCalledWith('New Group', undefined, undefined);
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

    it('should open create category dialog when clicking add category button', async () => {
      render(<CategoryManager {...defaultProps} />);

      const groupItem = screen.getByText('Development');
      fireEvent.click(groupItem);

      const addCategoryButtons = screen.getAllByText('Add category');
      const visibleAddCategoryButton = addCategoryButtons.find(
        (btn) => !btn.closest('[aria-hidden="true"]')
      );
      fireEvent.click(visibleAddCategoryButton!);

      expect(screen.getByTestId('create-category-dialog')).toBeInTheDocument();
    });

    it('should call onCreateCategory when creating new category via dialog', async () => {
      const onCreateCategory = vi.fn();
      render(<CategoryManager {...defaultProps} onCreateCategory={onCreateCategory} />);

      const groupItem = screen.getByText('Development');
      fireEvent.click(groupItem);

      const addCategoryButtons = screen.getAllByText('Add category');
      const visibleAddCategoryButton = addCategoryButtons.find(
        (btn) => !btn.closest('[aria-hidden="true"]')
      );
      fireEvent.click(visibleAddCategoryButton!);

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      expect(onCreateCategory).toHaveBeenCalledWith('grp-1', 'New Category', undefined, undefined);
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

      expect(screen.getByTestId('edit-input')).toBeInTheDocument();
    });

    it('should show inline edit input with current value when renaming', async () => {
      render(<CategoryManager {...defaultProps} />);

      const groupItem = screen.getByText('Testing');
      fireEvent.contextMenu(groupItem);

      const renameButton = screen.getByText('Rename');
      fireEvent.click(renameButton);

      const input = screen.getByTestId('edit-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Testing');
    });

    it('should cancel editing on Escape key', async () => {
      render(<CategoryManager {...defaultProps} />);

      const groupItem = screen.getByText('Testing');
      fireEvent.contextMenu(groupItem);

      const renameButton = screen.getByText('Rename');
      fireEvent.click(renameButton);

      const input = screen.getByTestId('edit-input');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(screen.queryByTestId('edit-input')).not.toBeInTheDocument();
    });
  });

  describe('selection state', () => {
    it('should highlight selected group', async () => {
      render(<CategoryManager {...defaultProps} selectedGroupId="grp-2" />);

      const testingGroup = screen.getByTestId('sidebar-item-testing');
      expect(testingGroup).toHaveAttribute('data-selected', 'true');
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

      const frontendCategory = screen.getByTestId('sidebar-item-frontend');
      expect(frontendCategory).toHaveAttribute('data-selected', 'true');
    });
  });
});