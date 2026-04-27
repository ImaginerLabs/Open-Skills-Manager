import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScopeSelector } from './ScopeSelector';
import { useProjectStore } from '../../../stores/projectStore';

vi.mock('../../../stores/projectStore', () => ({
  useProjectStore: vi.fn(),
}));

describe('ScopeSelector', () => {
  const defaultProps = {
    value: 'all' as const,
    selectedProjectId: null,
    onScopeChange: vi.fn(),
    onProjectChange: vi.fn(),
  };

  const mockProjects = [
    { id: 'proj-1', name: 'Project One', path: '/path/one', exists: true },
    { id: 'proj-2', name: 'Project Two', path: '/path/two', exists: false },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProjectStore).mockReturnValue({ projects: mockProjects } as unknown as ReturnType<typeof useProjectStore>);
  });

  it('displays "All Scopes" by default', () => {
    render(<ScopeSelector {...defaultProps} />);
    expect(screen.getByText('All Scopes')).toBeInTheDocument();
  });

  it('displays scope label for library', () => {
    render(<ScopeSelector {...defaultProps} value="library" />);
    expect(screen.getByText('App Library')).toBeInTheDocument();
  });

  it('displays scope label for global', () => {
    render(<ScopeSelector {...defaultProps} value="global" />);
    expect(screen.getByText('Global Skills')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<ScopeSelector {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /All Scopes/ }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('App Library')).toBeInTheDocument();
    expect(screen.getByText('Global Skills')).toBeInTheDocument();
  });

  it('calls onScopeChange when scope selected', () => {
    const onScopeChange = vi.fn();
    render(<ScopeSelector {...defaultProps} onScopeChange={onScopeChange} />);

    fireEvent.click(screen.getByRole('button', { name: /All Scopes/ }));
    fireEvent.click(screen.getByRole('option', { name: /App Library/ }));

    expect(onScopeChange).toHaveBeenCalledWith('library');
  });

  it('displays projects in dropdown', () => {
    render(<ScopeSelector {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /All Scopes/ }));

    expect(screen.getByText('Project One')).toBeInTheDocument();
    expect(screen.getByText('Project Two')).toBeInTheDocument();
  });

  it('calls onProjectChange when project selected', () => {
    const onScopeChange = vi.fn();
    const onProjectChange = vi.fn();
    render(<ScopeSelector {...defaultProps} onScopeChange={onScopeChange} onProjectChange={onProjectChange} />);

    fireEvent.click(screen.getByRole('button', { name: /All Scopes/ }));
    fireEvent.click(screen.getByRole('option', { name: /Project One/ }));

    expect(onScopeChange).toHaveBeenCalledWith('project');
    expect(onProjectChange).toHaveBeenCalledWith('proj-1');
  });

  it('shows selected project name', () => {
    render(<ScopeSelector {...defaultProps} value="project" selectedProjectId="proj-1" />);
    expect(screen.getByText('Project One')).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <ScopeSelector {...defaultProps} />
        <div data-testid="outside">Outside</div>
      </div>
    );

    fireEvent.click(screen.getByRole('button', { name: /All Scopes/ }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
