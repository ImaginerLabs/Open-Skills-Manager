import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConflictDialog } from './index';
import type { ConflictInfo } from '@/services/icloudService';

const mockConflict: ConflictInfo = {
  skillId: 'skill-1',
  skillName: 'Test Skill',
  localVersion: {
    modifiedTime: '2026-04-27T10:00:00Z',
    size: 1024,
    deviceName: 'MacBook Pro',
  },
  remoteVersion: {
    modifiedTime: '2026-04-27T09:30:00Z',
    size: 2048,
    deviceName: 'iMac',
  },
};

describe('ConflictDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnResolve = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnResolve.mockResolvedValue(undefined);
  });

  it('renders nothing when closed', () => {
    render(
      <ConflictDialog open={false} conflict={null} onClose={mockOnClose} onResolve={mockOnResolve} />
    );
    expect(screen.queryByText('Sync Conflict')).toBeNull();
  });

  it('renders nothing when conflict is null', () => {
    render(
      <ConflictDialog open={true} conflict={null} onClose={mockOnClose} onResolve={mockOnResolve} />
    );
    expect(screen.queryByText('Sync Conflict')).toBeNull();
  });

  it('renders conflict details when open with conflict', () => {
    render(
      <ConflictDialog open={true} conflict={mockConflict} onClose={mockOnClose} onResolve={mockOnResolve} />
    );

    expect(screen.getByText('Sync Conflict: Test Skill')).toBeInTheDocument();
    expect(screen.getByText('Local Version')).toBeInTheDocument();
    expect(screen.getByText('Remote Version')).toBeInTheDocument();
    expect(screen.getByText('Keep Local')).toBeInTheDocument();
    expect(screen.getByText('Keep Remote')).toBeInTheDocument();
    expect(screen.getByText('Keep Both')).toBeInTheDocument();
  });

  it('allows selecting resolution options', async () => {
    render(
      <ConflictDialog open={true} conflict={mockConflict} onClose={mockOnClose} onResolve={mockOnResolve} />
    );

    const keepLocalBtn = screen.getByText('Keep Local').closest('button');
    expect(keepLocalBtn?.className).not.toContain('selected');

    fireEvent.click(keepLocalBtn!);

    await waitFor(() => {
      expect(keepLocalBtn?.className).toContain('selected');
    });
  });

  it('calls onResolve when resolving conflict', async () => {
    render(
      <ConflictDialog open={true} conflict={mockConflict} onClose={mockOnClose} onResolve={mockOnResolve} />
    );

    fireEvent.click(screen.getByText('Keep Local').closest('button')!);
    fireEvent.click(screen.getByText('Resolve Conflict'));

    await waitFor(() => {
      expect(mockOnResolve).toHaveBeenCalledWith('skill-1', 'local');
    });
  });

  it('closes dialog on cancel', () => {
    render(
      <ConflictDialog open={true} conflict={mockConflict} onClose={mockOnClose} onResolve={mockOnResolve} />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables resolve button when no selection', () => {
    render(
      <ConflictDialog open={true} conflict={mockConflict} onClose={mockOnClose} onResolve={mockOnResolve} />
    );

    expect(screen.getByText('Resolve Conflict')).toBeDisabled();
  });
});