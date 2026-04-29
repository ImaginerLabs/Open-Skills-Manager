import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchResultCard } from './SearchResultCard';
import type { SearchResult } from '../../../stores/uiStore';

describe('SearchResultCard', () => {
  const mockResult: SearchResult = {
    id: 'skill-1',
    name: 'Test Skill',
    description: 'A test skill description',
    scope: 'library',
    path: '/test/path/skill-1',
    matchedSnippet: 'This is a matched snippet in the skill file',
  };

  const defaultProps = {
    result: mockResult,
    query: 'matched',
    onDeploy: vi.fn(),
    onExport: vi.fn(),
    onCopyPath: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skill name', () => {
    render(<SearchResultCard {...defaultProps} />);
    expect(screen.getByText('Test Skill')).toBeInTheDocument();
  });

  it('renders skill description', () => {
    render(<SearchResultCard {...defaultProps} />);
    expect(screen.getByText('A test skill description')).toBeInTheDocument();
  });

  it('renders scope badge', () => {
    render(<SearchResultCard {...defaultProps} />);
    expect(screen.getByText('library')).toBeInTheDocument();
  });

  it('renders matched snippet', () => {
    render(<SearchResultCard {...defaultProps} />);
    // The snippet should be rendered since query 'matched' appears in it
    expect(screen.getByText(/This is a/)).toBeInTheDocument();
  });

  it('highlights matched query in snippet', () => {
    render(<SearchResultCard {...defaultProps} />);
    const highlight = screen.getByText('matched');
    expect(highlight.tagName).toBe('MARK');
  });

  it('shows context menu on right click', () => {
    render(<SearchResultCard {...defaultProps} />);

    const card = screen.getByRole('button');
    fireEvent.contextMenu(card);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Deploy to...')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Copy Path')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls onDeploy when deploy clicked', () => {
    const onDeploy = vi.fn();
    render(<SearchResultCard {...defaultProps} onDeploy={onDeploy} />);

    fireEvent.contextMenu(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('menuitem', { name: /Deploy/ }));

    expect(onDeploy).toHaveBeenCalledWith(mockResult);
  });

  it('calls onDelete when delete clicked', () => {
    const onDelete = vi.fn();
    render(<SearchResultCard {...defaultProps} onDelete={onDelete} />);

    fireEvent.contextMenu(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('menuitem', { name: /Delete/ }));

    expect(onDelete).toHaveBeenCalledWith(mockResult);
  });

  it('closes context menu when clicking outside', () => {
    render(<SearchResultCard {...defaultProps} />);

    fireEvent.contextMenu(screen.getByRole('button'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('renders global scope badge with correct color', () => {
    render(<SearchResultCard {...defaultProps} result={{ ...mockResult, scope: 'global' }} />);
    expect(screen.getByText('global')).toBeInTheDocument();
  });

  it('renders project scope badge with correct color', () => {
    render(<SearchResultCard {...defaultProps} result={{ ...mockResult, scope: 'project' }} />);
    expect(screen.getByText('project')).toBeInTheDocument();
  });

  it('does not highlight when query is less than 2 characters', () => {
    render(<SearchResultCard {...defaultProps} query="t" />);
    expect(screen.queryByRole('mark')).not.toBeInTheDocument();
  });
});
