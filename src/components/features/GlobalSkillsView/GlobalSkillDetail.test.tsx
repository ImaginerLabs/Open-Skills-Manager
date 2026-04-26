import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GlobalSkillDetail } from './GlobalSkillDetail';
import type { GlobalSkill } from '../../../stores/globalStore';

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

const mockSkillMdContent = `
# Test Skill

This is a test skill for testing purposes.

## Features

- Feature 1
- Feature 2
`;

describe('GlobalSkillDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when skill is null', () => {
    const { container } = render(<GlobalSkillDetail skill={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders skill information', () => {
    render(<GlobalSkillDetail skill={mockSkill} />);

    expect(screen.getByText('Test Skill')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('5 files')).toBeInTheDocument();
  });

  it('renders SKILL.md content', () => {
    render(<GlobalSkillDetail skill={mockSkill} skillMdContent={mockSkillMdContent} />);

    // Markdown content
    expect(screen.getByText('This is a test skill for testing purposes.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Features' })).toBeInTheDocument();
  });

  it('shows empty message when no SKILL.md content', () => {
    render(<GlobalSkillDetail skill={mockSkill} skillMdContent="" />);

    expect(screen.getByText('No SKILL.md content available')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<GlobalSkillDetail skill={mockSkill} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close details' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('calls onClose when Escape key is pressed', async () => {
    const onClose = vi.fn();
    render(<GlobalSkillDetail skill={mockSkill} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('calls onPull when Pull button is clicked', () => {
    const onPull = vi.fn();
    render(<GlobalSkillDetail skill={mockSkill} onPull={onPull} />);

    fireEvent.click(screen.getByRole('button', { name: /Pull to Library/ }));

    expect(onPull).toHaveBeenCalledWith(mockSkill);
  });

  it('has correct aria label', () => {
    render(<GlobalSkillDetail skill={mockSkill} />);

    expect(screen.getByLabelText('Global skill details')).toBeInTheDocument();
  });
});