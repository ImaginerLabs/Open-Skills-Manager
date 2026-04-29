import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PullToLibraryDialog } from './PullToLibraryDialog';
import type { GlobalSkill } from '../../../stores/globalStore';

vi.mock('../../../services/libraryService', () => ({
  libraryService: {
    import: vi.fn(),
    list: vi.fn(),
  },
}));

vi.mock('../../../stores/uiStore', () => ({
  useUIStore: () => ({
    showToast: vi.fn(),
  }),
}));

vi.mock('../../../stores/libraryStore', () => ({
  useLibraryStore: () => ({
    groups: [
      { id: 'g1', name: 'Group A', categories: [{ id: 'c1', name: 'Cat 1', groupId: 'g1' }] },
      { id: 'g2', name: 'Group B', categories: [] },
    ],
    setSkills: vi.fn(),
    setLoading: vi.fn(),
  }),
}));

const mockSkill: GlobalSkill = {
  id: 'test-skill-1',
  name: 'Test Skill',
  folderName: 'test-skill',
  version: '1.0.0',
  description: 'A test skill for testing',
  path: '/Users/test/.claude/skills/test-skill',
  skillMdPath: '/Users/test/.claude/skills/test-skill/SKILL.md',
  skillMdLines: 50,
  skillMdChars: 1200,
  installedAt: '2024-01-01T00:00:00Z',
  size: 10240,
  fileCount: 5,
  hasResources: false,
  isSymlink: false,
};

describe('PullToLibraryDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when skill is null', () => {
    const { container } = render(
      <PullToLibraryDialog isOpen={true} skill={null} onClose={vi.fn()} onComplete={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog with group/category selection when skill is provided', () => {
    render(
      <PullToLibraryDialog isOpen={true} skill={mockSkill} onClose={vi.fn()} onComplete={vi.fn()} />
    );

    expect(screen.getByRole('heading', { name: /Pull "Test Skill"/ })).toBeInTheDocument();
    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByText('Group B')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <PullToLibraryDialog isOpen={true} skill={mockSkill} onClose={onClose} onComplete={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls libraryService.import with no group/category by default', async () => {
    const { libraryService } = await import('../../../services/libraryService');
    const onComplete = vi.fn();
    const mockImport = vi.mocked(libraryService.import);
    const mockList = vi.mocked(libraryService.list);
    mockImport.mockResolvedValueOnce({ success: true, data: { id: 'new-id', name: 'Test Skill' } as never });
    mockList.mockResolvedValueOnce({ success: true, data: [] });

    render(
      <PullToLibraryDialog isOpen={true} skill={mockSkill} onClose={vi.fn()} onComplete={onComplete} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pull to Library' }));

    await waitFor(() => {
      expect(mockImport).toHaveBeenCalledWith({ path: mockSkill.path, groupId: undefined, categoryId: undefined });
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('selects a group and shows its categories', () => {
    render(
      <PullToLibraryDialog isOpen={true} skill={mockSkill} onClose={vi.fn()} onComplete={vi.fn()} />
    );

    fireEvent.click(screen.getByText('Group A'));

    expect(screen.getByText('Cat 1')).toBeInTheDocument();
  });

  it('calls libraryService.import with selected group and category', async () => {
    const { libraryService } = await import('../../../services/libraryService');
    const onComplete = vi.fn();
    const mockImport = vi.mocked(libraryService.import);
    const mockList = vi.mocked(libraryService.list);
    mockImport.mockResolvedValueOnce({ success: true, data: { id: 'new-id', name: 'Test Skill' } as never });
    mockList.mockResolvedValueOnce({ success: true, data: [] });

    render(
      <PullToLibraryDialog isOpen={true} skill={mockSkill} onClose={vi.fn()} onComplete={onComplete} />
    );

    fireEvent.click(screen.getByText('Group A'));
    fireEvent.click(screen.getByText('Cat 1'));
    fireEvent.click(screen.getByRole('button', { name: 'Pull to Library' }));

    await waitFor(() => {
      expect(mockImport).toHaveBeenCalledWith({ path: mockSkill.path, groupId: 'g1', categoryId: 'c1' });
    });
  });

  it('shows pulling state during operation', async () => {
    const { libraryService } = await import('../../../services/libraryService');
    const mockImport = vi.mocked(libraryService.import);
    const mockList = vi.mocked(libraryService.list);
    mockImport.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    mockList.mockResolvedValueOnce({ success: true, data: [] });

    render(
      <PullToLibraryDialog isOpen={true} skill={mockSkill} onClose={vi.fn()} onComplete={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pull to Library' }));

    expect(screen.getByText('Pulling...')).toBeInTheDocument();
  });

  it('disables buttons during pulling', async () => {
    const { libraryService } = await import('../../../services/libraryService');
    const mockImport = vi.mocked(libraryService.import);
    const mockList = vi.mocked(libraryService.list);
    mockImport.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    mockList.mockResolvedValueOnce({ success: true, data: [] });

    render(
      <PullToLibraryDialog isOpen={true} skill={mockSkill} onClose={vi.fn()} onComplete={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pull to Library' }));

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pulling...' })).toBeDisabled();
  });

  it('resets selection when dialog reopens', () => {
    const { rerender } = render(
      <PullToLibraryDialog isOpen={true} skill={mockSkill} onClose={vi.fn()} onComplete={vi.fn()} />
    );

    fireEvent.click(screen.getByText('Group A'));

    rerender(
      <PullToLibraryDialog isOpen={false} skill={mockSkill} onClose={vi.fn()} onComplete={vi.fn()} />
    );
    rerender(
      <PullToLibraryDialog isOpen={true} skill={mockSkill} onClose={vi.fn()} onComplete={vi.fn()} />
    );

    // "No group" should be selected by default (shown by the Check icon on it)
    expect(screen.getByText('Leave unassigned')).toBeInTheDocument();
  });
});
