import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewToggle } from './ViewToggle';

describe('ViewToggle', () => {
  it('renders both grid and list buttons', () => {
    render(<ViewToggle viewMode="grid" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Grid view')).toBeInTheDocument();
    expect(screen.getByLabelText('List view')).toBeInTheDocument();
  });

  it('shows grid as active when viewMode is grid', () => {
    render(<ViewToggle viewMode="grid" onChange={vi.fn()} />);

    const gridButton = screen.getByLabelText('Grid view');
    const listButton = screen.getByLabelText('List view');

    expect(gridButton).toHaveAttribute('aria-pressed', 'true');
    expect(listButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows list as active when viewMode is list', () => {
    render(<ViewToggle viewMode="list" onChange={vi.fn()} />);

    const gridButton = screen.getByLabelText('Grid view');
    const listButton = screen.getByLabelText('List view');

    expect(gridButton).toHaveAttribute('aria-pressed', 'false');
    expect(listButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onChange with grid when grid button clicked', () => {
    const handleChange = vi.fn();
    render(<ViewToggle viewMode="list" onChange={handleChange} />);

    fireEvent.click(screen.getByLabelText('Grid view'));

    expect(handleChange).toHaveBeenCalledWith('grid');
  });

  it('calls onChange with list when list button clicked', () => {
    const handleChange = vi.fn();
    render(<ViewToggle viewMode="grid" onChange={handleChange} />);

    fireEvent.click(screen.getByLabelText('List view'));

    expect(handleChange).toHaveBeenCalledWith('list');
  });

  it('has correct role and aria-label', () => {
    render(<ViewToggle viewMode="grid" onChange={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'View mode toggle' })).toBeInTheDocument();
  });
});