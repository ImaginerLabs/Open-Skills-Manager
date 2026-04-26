import { Rocket } from '@phosphor-icons/react';
import type { Deployment } from '@/stores/libraryStore';
import styles from './DeploymentTracking.module.scss';

export interface DeploymentBadgeProps {
  deployments: Deployment[];
  onClick?: () => void;
}

export function DeploymentBadge({ deployments, onClick }: DeploymentBadgeProps): React.ReactElement | null {
  const count = deployments.length;

  if (count === 0) {
    return null;
  }

  const isClickable = onClick !== undefined;

  if (isClickable) {
    return (
      <button
        type="button"
        className={styles.deploymentBadge}
        onClick={onClick}
        aria-label={`${count} deployment${count !== 1 ? 's' : ''}`}
        role="button"
      >
        <Rocket size={12} weight="fill" />
        <span>{count}</span>
      </button>
    );
  }

  return (
    <span
      className={styles.deploymentBadge}
      aria-label={`${count} deployment${count !== 1 ? 's' : ''}`}
      role="status"
    >
      <Rocket size={12} weight="fill" />
      <span>{count}</span>
    </span>
  );
}
