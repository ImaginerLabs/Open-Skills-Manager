import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeploymentList } from '@/components/features/DeploymentTracking/DeploymentList';
import type { Deployment } from '@/stores/libraryStore';

describe('DeploymentList', () => {
  const mockDeployments: Deployment[] = [
    {
      id: 'dep-1',
      skillId: 'skill-1',
      targetScope: 'global',
      targetPath: '~/.claude/skills/test-skill',
      deployedAt: new Date('2026-04-20T10:00:00Z'),
    },
    {
      id: 'dep-2',
      skillId: 'skill-1',
      targetScope: 'project',
      targetPath: '/projects/my-project/.claude/skills/test-skill',
      projectName: 'My Project',
      deployedAt: new Date('2026-04-21T14:30:00Z'),
    },
    {
      id: 'dep-3',
      skillId: 'skill-1',
      targetScope: 'project',
      targetPath: '/projects/another-project/.claude/skills/test-skill',
      projectName: 'Another Project',
      deployedAt: new Date('2026-04-22T09:15:00Z'),
    },
  ];

  it('renders list of deployments', () => {
    render(<DeploymentList deployments={mockDeployments} />);
    // Check for the outer list by its class
    const lists = screen.getAllByRole('list');
    expect(lists.length).toBeGreaterThan(0);
  });

  it('renders each deployment target', () => {
    render(<DeploymentList deployments={mockDeployments} />);
    // "Global" appears in group label and deployment target, so use getAllByText
    expect(screen.getAllByText('Global').length).toBeGreaterThan(0);
    expect(screen.getByText('My Project')).toBeInTheDocument();
    expect(screen.getByText('Another Project')).toBeInTheDocument();
  });

  it('renders empty state when no deployments', () => {
    render(<DeploymentList deployments={[]} />);
    expect(screen.getByText('No deployments')).toBeInTheDocument();
  });

  it('calls onRemove when remove button clicked', async () => {
    const handleRemove = vi.fn();
    render(<DeploymentList deployments={mockDeployments} onRemove={handleRemove} />);

    const removeButtons = screen.getAllByRole('button', { name: /remove deployment/i });
    const firstButton = removeButtons[0];
    if (firstButton) {
      await firstButton.click();
    }

    expect(handleRemove).toHaveBeenCalledWith('dep-1');
  });

  it('does not show remove button when onRemove not provided', () => {
    render(<DeploymentList deployments={mockDeployments} />);
    expect(screen.queryByRole('button', { name: /remove deployment/i })).not.toBeInTheDocument();
  });

  it('shows "Global" label for global scope deployments', () => {
    render(<DeploymentList deployments={mockDeployments} />);
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.some(item => item.textContent?.includes('Global'))).toBe(true);
  });

  it('shows project name for project scope deployments', () => {
    render(<DeploymentList deployments={mockDeployments} />);
    expect(screen.getByText('My Project')).toBeInTheDocument();
  });

  it('renders section title with count', () => {
    render(<DeploymentList deployments={mockDeployments} />);
    expect(screen.getByText('Deployments (3)')).toBeInTheDocument();
  });

  it('renders deployment icons', () => {
    render(<DeploymentList deployments={mockDeployments} />);
    // Check that SVG icons are rendered (Rocket icon in title)
    const section = screen.getByText('Deployments (3)').closest('section');
    expect(section?.querySelectorAll('svg').length).toBeGreaterThan(0);
  });

  it('groups deployments by scope', () => {
    render(<DeploymentList deployments={mockDeployments} />);
    // Check for Projects group label (Global appears in both group label and deployment target)
    expect(screen.getByText('Projects')).toBeInTheDocument();
    // Verify there are deployment items under Global scope
    expect(screen.getAllByText('Global').length).toBeGreaterThanOrEqual(1);
  });
});
