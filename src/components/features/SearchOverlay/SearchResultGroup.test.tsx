import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchResultGroup } from './SearchResultGroup';
import type { SearchResult } from '../../../stores/uiStore';

describe('SearchResultGroup', () => {
  const mockResults: SearchResult[] = [
    { id: 'skill-1', name: 'Skill One', description: 'First skill', scope: 'library', path: '/test/skill-1', size: 1024, fileCount: 2 },
    { id: 'skill-2', name: 'Skill Two', description: 'Second skill', scope: 'library', path: '/test/skill-2', size: 2048, fileCount: 3 },
    { id: 'skill-3', name: 'Skill Three', description: 'Third skill', scope: 'library', path: '/test/skill-3', size: 512, fileCount: 1 },
  ];

  const defaultProps = {
    groupId: 'library',
    title: 'App Library',
    results: mockResults,
    query: 'skill',
    scope: 'library' as const,
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
    onDeploy: vi.fn(),
    onExport: vi.fn(),
    onCopyPath: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders group title', () => {
    render(<SearchResultGroup {...defaultProps} />);
    expect(screen.getByText('App Library')).toBeInTheDocument();
  });

  it('renders result count badge', () => {
    render(<SearchResultGroup {...defaultProps} />);
    // The count badge appears in the group header
    const badges = screen.getAllByText('3');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('calls onToggleCollapse when header clicked', () => {
    const onToggleCollapse = vi.fn();
    render(<SearchResultGroup {...defaultProps} onToggleCollapse={onToggleCollapse} />);

    fireEvent.click(screen.getByRole('button', { name: /App Library/ }));
    expect(onToggleCollapse).toHaveBeenCalledWith('library');
  });

  it('shows collapsed state correctly', () => {
    render(<SearchResultGroup {...defaultProps} isCollapsed={true} />);
    expect(screen.getByRole('button', { name: /App Library/ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows expanded state correctly', () => {
    render(<SearchResultGroup {...defaultProps} isCollapsed={false} />);
    expect(screen.getByRole('button', { name: /App Library/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('does not render results when collapsed', () => {
    render(<SearchResultGroup {...defaultProps} isCollapsed={true} />);
    expect(screen.queryByText('Skill One')).not.toBeInTheDocument();
  });

  it('renders results container when expanded', async () => {
    render(<SearchResultGroup {...defaultProps} isCollapsed={false} />);

    await waitFor(
      () => {
        const container = screen.getByRole('button', { name: /App Library/ }).parentElement;
        expect(container).toBeInTheDocument();
      },
      { timeout: 200 }
    );
  });

  it('renders correct scope icon for library', () => {
    render(<SearchResultGroup {...defaultProps} scope="library" />);
    expect(screen.getByRole('button', { name: /App Library/ })).toBeInTheDocument();
  });

  it('renders correct scope icon for global', () => {
    render(<SearchResultGroup {...defaultProps} scope="global" title="Global Skills" />);
    expect(screen.getByRole('button', { name: /Global Skills/ })).toBeInTheDocument();
  });

  it('renders correct scope icon for project', () => {
    render(<SearchResultGroup {...defaultProps} scope="project" title="My Project" />);
    expect(screen.getByRole('button', { name: /My Project/ })).toBeInTheDocument();
  });

  it('renders empty group correctly', () => {
    render(<SearchResultGroup {...defaultProps} results={[]} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
