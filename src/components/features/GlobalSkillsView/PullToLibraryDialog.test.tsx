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
  installedAt: new Date('2024-01-01'),
  size: 10240,
  fileCount: 5,
  hasResources: false,
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

  it('renders dialog when skill is provided and isOpen is true', () => {
    render(
      <PullToLibraryDialog isOpen={true} skill={mockSkill} onClose={vi.fn()} onComplete={vi.fn()} />
    );

    expect(screen.getByRole('heading', { name: 'Pull to Library' })).toBeInTheDocument();
    expect(screen.getByText('Test Skill')).toBeInTheDocument();
    expect(screen.getByText(/iCloud-synced Library folder/)).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <PullToLibraryDialog isOpen={true} skill={mockSkill} onClose={onClose} onComplete={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls libraryService.import when Pull button is clicked', async () => {
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
      expect(mockImport).toHaveBeenCalledWith({ path: mockSkill.path });
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
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
});