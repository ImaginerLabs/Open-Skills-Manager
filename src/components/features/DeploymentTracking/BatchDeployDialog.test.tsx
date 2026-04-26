import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BatchDeployDialog } from '@/components/features/DeploymentTracking/BatchDeployDialog';
import type { BatchDeployResult } from '@/hooks/useBatchDeploy';

describe('BatchDeployDialog', () => {
  const mockResult: BatchDeployResult = {
    success: [
      { id: 'dep-1', skillId: 'skill-1', targetScope: 'global', targetPath: '', deployedAt: new Date() },
      { id: 'dep-2', skillId: 'skill-2', targetScope: 'global', targetPath: '', deployedAt: new Date() },
    ],
    failed: [
      { skillId: 'skill-3', skillName: 'Skill 3', error: 'Permission denied' },
    ],
    cancelled: [],
  };

  it('renders progress during deployment', () => {
    render(
      <BatchDeployDialog
        isOpen
        status="deploying"
        progress={2}
        total={5}
        currentSkillName="Test Skill"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Deploying Skills...')).toBeInTheDocument();
    expect(screen.getByText('Test Skill')).toBeInTheDocument();
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('renders progress bar', () => {
    render(
      <BatchDeployDialog
        isOpen
        status="deploying"
        progress={3}
        total={10}
        currentSkillName="Test Skill"
        onClose={vi.fn()}
      />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '3');
    expect(progressBar).toHaveAttribute('aria-valuemax', '10');
  });

  it('renders cancel button during deployment', () => {
    const handleCancel = vi.fn();
    render(
      <BatchDeployDialog
        isOpen
        status="deploying"
        progress={1}
        total={5}
        currentSkillName="Test Skill"
        onClose={vi.fn()}
        onCancel={handleCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
  });

  it('renders completed state with result', () => {
    render(
      <BatchDeployDialog
        isOpen
        status="completed"
        progress={3}
        total={3}
        result={mockResult}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Deployment Complete')).toBeInTheDocument();
    expect(screen.getByText('2 succeeded')).toBeInTheDocument();
    expect(screen.getByText('1 failed')).toBeInTheDocument();
  });

  it('renders cancelled state', () => {
    const cancelledResult: BatchDeployResult = {
      success: [{ id: 'dep-1', skillId: 'skill-1', targetScope: 'global', targetPath: '', deployedAt: new Date() }],
      failed: [],
      cancelled: [
        { skillId: 'skill-2', skillName: 'Skill 2' },
        { skillId: 'skill-3', skillName: 'Skill 3' },
      ],
    };

    render(
      <BatchDeployDialog
        isOpen
        status="cancelled"
        progress={1}
        total={3}
        result={cancelledResult}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Deployment Cancelled')).toBeInTheDocument();
    expect(screen.getByText('2 cancelled')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <BatchDeployDialog
        isOpen={false}
        status="idle"
        progress={0}
        total={0}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const handleClose = vi.fn();
    render(
      <BatchDeployDialog
        isOpen
        status="completed"
        progress={3}
        total={3}
        result={mockResult}
        onClose={handleClose}
      />
    );

    // Use getAllByRole and pick the primary close button (the one with text)
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    // Pick the button in dialog actions (with text "Close")
    const primaryCloseButton = closeButtons.find(btn => btn.textContent?.includes('Close'));
    if (primaryCloseButton) {
      await primaryCloseButton.click();
    }

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', async () => {
    const handleCancel = vi.fn();
    render(
      <BatchDeployDialog
        isOpen
        status="deploying"
        progress={1}
        total={5}
        currentSkillName="Test Skill"
        onClose={vi.fn()}
        onCancel={handleCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await cancelButton.click();

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('renders retry button when there are failures', () => {
    const handleRetry = vi.fn();
    render(
      <BatchDeployDialog
        isOpen
        status="completed"
        progress={3}
        total={3}
        result={mockResult}
        onClose={vi.fn()}
        onRetryFailed={handleRetry}
      />
    );

    const retryButton = screen.getByRole('button', { name: /retry failed/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('does not render retry button when no failures', () => {
    const successResult: BatchDeployResult = {
      success: [{ id: 'dep-1', skillId: 'skill-1', targetScope: 'global', targetPath: '', deployedAt: new Date() }],
      failed: [],
      cancelled: [],
    };

    render(
      <BatchDeployDialog
        isOpen
        status="completed"
        progress={1}
        total={1}
        result={successResult}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /retry failed/i })).not.toBeInTheDocument();
  });

  it('displays failed skill errors', () => {
    render(
      <BatchDeployDialog
        isOpen
        status="completed"
        progress={3}
        total={3}
        result={mockResult}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Skill 3')).toBeInTheDocument();
    expect(screen.getByText('Permission denied')).toBeInTheDocument();
  });
});
