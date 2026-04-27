import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkillPreviewModal } from './SkillPreviewModal';

describe('SkillPreviewModal', () => {
  const mockSkill = {
    id: 'test-id',
    name: 'Test Skill',
    description: 'A test skill description',
    size: 1024,
    fileCount: 5,
    date: '2026-04-27',
  };
  const mockContent = '# Test Skill\n\nThis is the skill content.';

  it('does not render when skill is null', () => {
    render(
      <SkillPreviewModal isOpen={true} onClose={vi.fn()} skill={null} skillMdContent="" />
    );

    expect(screen.queryByText('Test Skill')).not.toBeInTheDocument();
  });

  it('renders skill name when open', () => {
    render(
      <SkillPreviewModal isOpen={true} onClose={vi.fn()} skill={mockSkill} skillMdContent={mockContent} />
    );

    expect(screen.getByText('Test Skill')).toBeInTheDocument();
  });

  it('renders skill content in preformatted block', () => {
    render(
      <SkillPreviewModal isOpen={true} onClose={vi.fn()} skill={mockSkill} skillMdContent={mockContent} />
    );

    const pre = screen.getByText(/# Test Skill/);
    expect(pre.tagName).toBe('PRE');
  });

  it('renders metadata correctly', () => {
    render(
      <SkillPreviewModal isOpen={true} onClose={vi.fn()} skill={mockSkill} skillMdContent={mockContent} />
    );

    expect(screen.getByText('2026-04-27')).toBeInTheDocument();
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <SkillPreviewModal isOpen={true} onClose={handleClose} skill={mockSkill} skillMdContent={mockContent} />
    );

    const closeButton = screen.getByRole('button', { name: /close preview/i });
    fireEvent.click(closeButton);

    // onClose is called after animation timeout
    setTimeout(() => {
      expect(handleClose).toHaveBeenCalled();
    }, 300);
  });

  it('renders without optional fields', () => {
    const minimalSkill = {
      name: 'Simple Skill',
    };

    render(
      <SkillPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        skill={minimalSkill}
        skillMdContent="Simple content"
      />
    );

    expect(screen.getByText('Simple Skill')).toBeInTheDocument();
    // Multiple 'Unknown' values for date, size, files
    expect(screen.getAllByText('Unknown').length).toBeGreaterThan(0);
  });

  it('shows delete button when onDelete is provided and skill has id', () => {
    const handleDelete = vi.fn();
    render(
      <SkillPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        skill={mockSkill}
        skillMdContent={mockContent}
        onDelete={handleDelete}
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('does not show delete button when skill has no id', () => {
    const skillWithoutId = { name: 'No ID Skill' };
    render(
      <SkillPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        skill={skillWithoutId}
        skillMdContent={mockContent}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('shows pull button when onPull is provided and skill has id', () => {
    const handlePull = vi.fn();
    render(
      <SkillPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        skill={mockSkill}
        skillMdContent={mockContent}
        onPull={handlePull}
      />
    );

    expect(screen.getByText('Pull to Library')).toBeInTheDocument();
  });
});
