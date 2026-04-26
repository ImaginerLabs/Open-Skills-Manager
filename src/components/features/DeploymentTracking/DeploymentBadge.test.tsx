import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeploymentBadge } from '@/components/features/DeploymentTracking/DeploymentBadge';
import type { Deployment } from '@/stores/libraryStore';

describe('DeploymentBadge', () => {
  const mockDeployments: Deployment[] = [
    {
      id: 'dep-1',
      skillId: 'skill-1',
      targetScope: 'global',
      targetPath: '~/.claude/skills/test-skill',
      deployedAt: new Date('2026-04-20'),
    },
    {
      id: 'dep-2',
      skillId: 'skill-1',
      targetScope: 'project',
      targetPath: '/projects/my-project/.claude/skills/test-skill',
      projectName: 'My Project',
      deployedAt: new Date('2026-04-21'),
    },
  ];

  it('renders deployment count when count > 0', () => {
    render(<DeploymentBadge deployments={mockDeployments} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('does not render when deployment count is 0', () => {
    render(<DeploymentBadge deployments={[]} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders rocket icon', () => {
    render(<DeploymentBadge deployments={mockDeployments} />);
    const badge = screen.getByRole('status');
    expect(badge.querySelector('svg')).toBeInTheDocument();
  });

  it('has correct aria-label for accessibility', () => {
    render(<DeploymentBadge deployments={mockDeployments} />);
    expect(screen.getByLabelText('2 deployments')).toBeInTheDocument();
  });

  it('applies success color styling', () => {
    render(<DeploymentBadge deployments={mockDeployments} />);
    const badge = screen.getByRole('status');
    expect(badge.className).toMatch(/deploymentBadge/);
  });

  it('is clickable when onClick provided', () => {
    const handleClick = vi.fn();
    render(<DeploymentBadge deployments={mockDeployments} onClick={handleClick} />);

    const badge = screen.getByRole('button');
    badge.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('has button role when clickable', () => {
    const handleClick = vi.fn();
    render(<DeploymentBadge deployments={mockDeployments} onClick={handleClick} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has status role when not clickable', () => {
    render(<DeploymentBadge deployments={mockDeployments} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders single deployment count correctly', () => {
    const singleDeployment = mockDeployments.length > 0 ? [mockDeployments[0]!] : [];
    render(<DeploymentBadge deployments={singleDeployment} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders large deployment count correctly', () => {
    const manyDeployments = Array.from({ length: 15 }, (_, i) => ({
      id: `dep-${i}`,
      skillId: 'skill-1',
      targetScope: 'project' as const,
      targetPath: `/project-${i}/.claude/skills/test-skill`,
      projectName: `Project ${i}`,
      deployedAt: new Date(),
    }));
    render(<DeploymentBadge deployments={manyDeployments} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });
});