import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlobalSkillCard } from './GlobalSkillCard';
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

describe('GlobalSkillCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skill information', () => {
    render(<GlobalSkillCard skill={mockSkill} />);

    expect(screen.getByText('Test Skill')).toBeInTheDocument();
    expect(screen.getByText('A test skill for testing')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<GlobalSkillCard skill={mockSkill} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'Global skill: Test Skill' }));

    expect(onSelect).toHaveBeenCalledWith(mockSkill);
  });

  it('shows selected state when isSelected is true', () => {
    render(<GlobalSkillCard skill={mockSkill} isSelected />);

    const card = screen.getByRole('button', { name: 'Global skill: Test Skill' });
    expect(card).toHaveAttribute('aria-selected', 'true');
  });

  it('opens context menu on right-click', () => {
    render(<GlobalSkillCard skill={mockSkill} />);

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Global skill: Test Skill' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Pull to Library')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('opens context menu on menu button click', () => {
    render(<GlobalSkillCard skill={mockSkill} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open context menu' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('calls onDelete when Delete is clicked', () => {
    const onDelete = vi.fn();
    render(<GlobalSkillCard skill={mockSkill} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open context menu' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Delete/ }));

    expect(onDelete).toHaveBeenCalledWith(mockSkill.id);
  });

  it('calls onPull when Pull to Library is clicked', () => {
    const onPull = vi.fn();
    render(<GlobalSkillCard skill={mockSkill} onPull={onPull} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open context menu' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Pull to Library/ }));

    expect(onPull).toHaveBeenCalledWith(mockSkill);
  });

  it('closes context menu on Escape key', () => {
    render(<GlobalSkillCard skill={mockSkill} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open context menu' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes context menu on outside click', () => {
    render(<GlobalSkillCard skill={mockSkill} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open context menu' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('shows From Library badge if skill has sourceLibrarySkillId', () => {
    const skillWithSource = {
      ...mockSkill,
      sourceLibrarySkillId: 'library-skill-1',
    };
    render(<GlobalSkillCard skill={skillWithSource} />);

    expect(screen.getByText('From Library')).toBeInTheDocument();
  });

  it('does not show version badge if version is 0.0.0', () => {
    const skillNoVersion = {
      ...mockSkill,
      version: '0.0.0',
    };
    render(<GlobalSkillCard skill={skillNoVersion} />);

    expect(screen.queryByText('v0.0.0')).not.toBeInTheDocument();
  });
});