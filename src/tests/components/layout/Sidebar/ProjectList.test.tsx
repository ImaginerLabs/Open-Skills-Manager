import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectList } from '@/components/layout/Sidebar/ProjectList';
import type { Project } from '@/stores/projectStore';

// Mock CSS modules
vi.mock('@/components/layout/Sidebar/ProjectList.module.scss', () => ({
  default: {
    container: 'container',
    header: 'header',
    title: 'title',
    addButton: 'addButton',
    list: 'list',
    emptyText: 'emptyText',
  },
}));

vi.mock('@/components/layout/Sidebar/ProjectItem.module.scss', () => ({
  default: {
    projectItem: 'projectItem',
    icon: 'icon',
    name: 'name',
    count: 'count',
    missing: 'missing',
    selected: 'selected',
    menuButton: 'menuButton',
  },
}));

vi.mock('@/components/layout/Sidebar/AddProjectButton.module.scss', () => ({
  default: {
    addButton: 'addButton',
  },
}));

// Mock SidebarItem
vi.mock('@/components/common/SidebarItem', () => ({
  SidebarItem: ({ name, count, isSelected, isMissing, onClick, onContextMenu, icon, missingIcon }: {
    name: string;
    count?: number;
    isSelected?: boolean;
    isMissing?: boolean;
    onClick?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    icon?: React.ReactNode;
    missingIcon?: React.ReactNode;
  }) => {
    return (
      <div
        data-testid={`sidebar-item-${name.toLowerCase().replace(/\s+/g, '-')}`}
        data-selected={isSelected}
        data-missing={isMissing}
        onClick={onClick}
        onContextMenu={onContextMenu}
        role="button"
        tabIndex={0}
        className={isSelected ? 'selected' : isMissing ? 'missing' : ''}
      >
        {missingIcon ? <span data-testid="missing-icon">{missingIcon}</span> : icon && <span data-testid="icon">{icon}</span>}
        <span>{name}</span>
        {count !== undefined && <span>{count}</span>}
      </div>
    );
  },
}));

// Mock ContextMenu
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

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'My Project',
    path: '/Users/test/projects/my-project',
    skillsPath: '/Users/test/projects/my-project/.claude/skills',
    exists: true,
    skillCount: 5,
    addedAt: new Date('2024-01-01'),
  },
  {
    id: 'proj-2',
    name: 'Another Project',
    path: '/Users/test/projects/another-project',
    skillsPath: '/Users/test/projects/another-project/.claude/skills',
    exists: false,
    skillCount: 0,
    addedAt: new Date('2024-01-02'),
  },
];

describe('ProjectList', () => {
  const defaultProps = {
    projects: mockProjects,
    selectedProjectId: undefined,
    onSelectProject: vi.fn(),
    onAddProject: vi.fn(),
    onRemoveProject: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render projects list', () => {
      render(<ProjectList {...defaultProps} />);
      expect(screen.getByText('My Project')).toBeInTheDocument();
      expect(screen.getByText('Another Project')).toBeInTheDocument();
    });

    it('should render header title', () => {
      render(<ProjectList {...defaultProps} />);
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('should render add project button', () => {
      render(<ProjectList {...defaultProps} />);
      expect(screen.getByLabelText('Add project')).toBeInTheDocument();
    });

    it('should render empty state when no projects', () => {
      render(<ProjectList {...defaultProps} projects={[]} />);
      expect(screen.getByText('No projects added')).toBeInTheDocument();
    });

    it('should render skill counts', () => {
      render(<ProjectList {...defaultProps} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should show missing indicator for non-existent projects', () => {
      render(<ProjectList {...defaultProps} />);
      const missingProject = screen.getByTestId('sidebar-item-another-project');
      expect(missingProject).toHaveAttribute('data-missing', 'true');
    });
  });

  describe('project interactions', () => {
    it('should call onSelectProject when clicking project', () => {
      const onSelectProject = vi.fn();
      render(<ProjectList {...defaultProps} onSelectProject={onSelectProject} />);

      const projectItem = screen.getByText('My Project');
      fireEvent.click(projectItem);

      expect(onSelectProject).toHaveBeenCalledWith('proj-1');
    });

    it('should highlight selected project', () => {
      render(<ProjectList {...defaultProps} selectedProjectId="proj-1" />);

      const selectedProject = screen.getByTestId('sidebar-item-my-project');
      expect(selectedProject).toHaveAttribute('data-selected', 'true');
    });
  });

  describe('add project', () => {
    it('should call onAddProject when clicking add button', async () => {
      const onAddProject = vi.fn();
      render(<ProjectList {...defaultProps} onAddProject={onAddProject} />);

      const addButton = screen.getByLabelText('Add project');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(onAddProject).toHaveBeenCalled();
      });
    });
  });

  describe('remove project', () => {
    it('should show remove confirmation on context menu', async () => {
      const onRemoveProject = vi.fn();
      render(<ProjectList {...defaultProps} onRemoveProject={onRemoveProject} />);

      const projectItem = screen.getByText('My Project');
      fireEvent.contextMenu(projectItem);

      expect(screen.getByText('Remove')).toBeInTheDocument();
    });

    it('should call onRemoveProject when confirming removal', async () => {
      const onRemoveProject = vi.fn();
      render(<ProjectList {...defaultProps} onRemoveProject={onRemoveProject} />);

      const projectItem = screen.getByText('My Project');
      fireEvent.contextMenu(projectItem);

      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(onRemoveProject).toHaveBeenCalledWith('proj-1');
      });
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(<ProjectList {...defaultProps} isLoading={true} />);
      expect(screen.getByTestId('projects-loading')).toBeInTheDocument();
    });
  });
});
