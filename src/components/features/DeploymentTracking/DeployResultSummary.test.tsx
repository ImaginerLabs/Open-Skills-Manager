import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeployResultSummary } from '@/components/features/DeploymentTracking/DeployResultSummary';
import type { BatchDeployResult } from '@/hooks/useBatchDeploy';

describe('DeployResultSummary', () => {
  const mockResult: BatchDeployResult = {
    success: [
      { id: 'dep-1', skillId: 'skill-1', targetScope: 'global', targetPath: '', deployedAt: new Date() },
      { id: 'dep-2', skillId: 'skill-2', targetScope: 'global', targetPath: '', deployedAt: new Date() },
    ],
    failed: [
      { skillId: 'skill-3', skillName: 'Failed Skill', error: 'Permission denied' },
    ],
    cancelled: [
      { skillId: 'skill-4', skillName: 'Cancelled Skill' },
    ],
  };

  it('renders all result categories', () => {
    render(<DeployResultSummary result={mockResult} />);

    expect(screen.getByText('2 deployed')).toBeInTheDocument();
    expect(screen.getByText('1 failed')).toBeInTheDocument();
    expect(screen.getByText('1 cancelled')).toBeInTheDocument();
  });

  it('renders only success when only success exists', () => {
    const successOnly: BatchDeployResult = {
      success: [{ id: 'dep-1', skillId: 'skill-1', targetScope: 'global', targetPath: '', deployedAt: new Date() }],
      failed: [],
      cancelled: [],
    };

    render(<DeployResultSummary result={successOnly} />);

    expect(screen.getByText('1 deployed')).toBeInTheDocument();
    expect(screen.queryByText(/failed/)).not.toBeInTheDocument();
    expect(screen.queryByText(/cancelled/)).not.toBeInTheDocument();
  });

  it('renders success icon', () => {
    render(<DeployResultSummary result={mockResult} />);
    expect(screen.getByRole('img', { name: 'success' })).toBeInTheDocument();
  });

  it('renders warning icon for failures', () => {
    render(<DeployResultSummary result={mockResult} />);
    expect(screen.getByRole('img', { name: 'warning' })).toBeInTheDocument();
  });

  it('renders cancelled icon', () => {
    render(<DeployResultSummary result={mockResult} />);
    expect(screen.getByRole('img', { name: 'cancelled' })).toBeInTheDocument();
  });

  it('hides failed section when no failures', () => {
    const noFailures: BatchDeployResult = {
      success: [{ id: 'dep-1', skillId: 'skill-1', targetScope: 'global', targetPath: '', deployedAt: new Date() }],
      failed: [],
      cancelled: [],
    };

    render(<DeployResultSummary result={noFailures} />);
    expect(screen.queryByRole('img', { name: 'warning' })).not.toBeInTheDocument();
  });

  it('hides cancelled section when no cancelled', () => {
    const noCancelled: BatchDeployResult = {
      success: [{ id: 'dep-1', skillId: 'skill-1', targetScope: 'global', targetPath: '', deployedAt: new Date() }],
      failed: [],
      cancelled: [],
    };

    render(<DeployResultSummary result={noCancelled} />);
    expect(screen.queryByRole('img', { name: 'cancelled' })).not.toBeInTheDocument();
  });

  it('calls onUndoAll when undo button clicked', async () => {
    const handleUndo = vi.fn();
    render(<DeployResultSummary result={mockResult} onUndoAll={handleUndo} />);

    const undoButton = screen.getByRole('button', { name: /undo all/i });
    await undoButton.click();

    expect(handleUndo).toHaveBeenCalledTimes(1);
  });

  it('does not render undo button when onUndoAll not provided', () => {
    render(<DeployResultSummary result={mockResult} />);
    expect(screen.queryByRole('button', { name: /undo all/i })).not.toBeInTheDocument();
  });

  it('shows undo button only when there are successful deployments', () => {
    const handleUndo = vi.fn();
    const noSuccess: BatchDeployResult = {
      success: [],
      failed: [{ skillId: 'skill-1', skillName: 'Failed', error: 'Error' }],
      cancelled: [],
    };

    render(<DeployResultSummary result={noSuccess} onUndoAll={handleUndo} />);
    expect(screen.queryByRole('button', { name: /undo all/i })).not.toBeInTheDocument();
  });

  it('renders empty state for empty result', () => {
    const empty: BatchDeployResult = {
      success: [],
      failed: [],
      cancelled: [],
    };

    render(<DeployResultSummary result={empty} />);
    expect(screen.getByText('No deployments')).toBeInTheDocument();
  });
});