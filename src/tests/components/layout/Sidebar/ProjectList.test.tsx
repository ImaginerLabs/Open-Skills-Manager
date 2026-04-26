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
      const missingProject = screen.getByText('Another Project').closest('.missing');
      expect(missingProject).toBeTruthy();
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

      const selectedProject = screen.getByText('My Project').closest('.selected');
      expect(selectedProject).toBeTruthy();
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
