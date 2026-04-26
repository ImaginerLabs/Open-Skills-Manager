import { Rocket, X, Globe, Folder } from '@phosphor-icons/react';
import type { Deployment } from '@/stores/libraryStore';
import { formatDate } from '@/utils/formatters';
import styles from './DeploymentTracking.module.scss';

export interface DeploymentListProps {
  deployments: Deployment[];
  onRemove?: (deploymentId: string) => void;
}

export function DeploymentList({ deployments, onRemove }: DeploymentListProps): React.ReactElement {
  if (deployments.length === 0) {
    return (
      <section className={styles.deploymentListSection}>
        <h3 className={styles.sectionTitle}>
          <Rocket size={14} weight="fill" />
          <span>Deployments (0)</span>
        </h3>
        <p className={styles.emptyState}>No deployments</p>
      </section>
    );
  }

  const globalDeployments = deployments.filter((d) => d.targetScope === 'global');
  const projectDeployments = deployments.filter((d) => d.targetScope === 'project');

  return (
    <section className={styles.deploymentListSection}>
      <h3 className={styles.sectionTitle}>
        <Rocket size={14} weight="fill" />
        <span>Deployments ({deployments.length})</span>
      </h3>

      <ul className={styles.deploymentList} role="list">
        {globalDeployments.length > 0 && (
          <li className={styles.deploymentGroup}>
            <span className={styles.groupLabel}>
              <Globe size={12} />
              <span>Global</span>
            </span>
            <ul className={styles.groupList}>
              {globalDeployments.map((dep) => (
                <DeploymentItem key={dep.id} deployment={dep} onRemove={onRemove ?? undefined} />
              ))}
            </ul>
          </li>
        )}

        {projectDeployments.length > 0 && (
          <li className={styles.deploymentGroup}>
            <span className={styles.groupLabel}>
              <Folder size={12} />
              <span>Projects</span>
            </span>
            <ul className={styles.groupList}>
              {projectDeployments.map((dep) => (
                <DeploymentItem key={dep.id} deployment={dep} onRemove={onRemove ?? undefined} />
              ))}
            </ul>
          </li>
        )}
      </ul>
    </section>
  );
}

interface DeploymentItemProps {
  deployment: Deployment;
  onRemove?: ((deploymentId: string) => void) | undefined;
}

function DeploymentItem({ deployment, onRemove }: DeploymentItemProps): React.ReactElement {
  const targetLabel = deployment.targetScope === 'global'
    ? 'Global'
    : deployment.projectName || 'Project';

  return (
    <li className={styles.deploymentItem} role="listitem">
      <span className={styles.deploymentTarget}>{targetLabel}</span>
      <span className={styles.deploymentDate}>{formatDate(deployment.deployedAt)}</span>
      {onRemove && (
        <button
          type="button"
          className={styles.removeButton}
          onClick={() => onRemove(deployment.id)}
          aria-label="Remove deployment"
        >
          <X size={12} />
        </button>
      )}
    </li>
  );
}
