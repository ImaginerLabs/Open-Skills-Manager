import { Clock, Warning, Spinner } from '@phosphor-icons/react';
import { formatDate } from '../../../utils/formatters';
import styles from './ProjectSkillsView.module.scss';

export interface RefreshIndicatorProps {
  isRefreshing: boolean;
  lastRefreshAt: Date | null;
  error: string | null;
}

export function RefreshIndicator({
  isRefreshing,
  lastRefreshAt,
  error,
}: RefreshIndicatorProps): React.ReactElement | null {
  if (isRefreshing) {
    return (
      <div className={styles.refreshIndicator}>
        <Spinner size={12} className={styles.spinning} />
        <span className={styles.refreshText}>Refreshing...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={[styles.refreshIndicator, styles.error].filter(Boolean).join(' ')}>
        <Warning size={12} />
        <span className={styles.refreshText}>Refresh failed</span>
      </div>
    );
  }

  if (lastRefreshAt) {
    return (
      <div className={styles.refreshIndicator}>
        <Clock size={12} />
        <span className={styles.refreshText}>Last refresh: {formatDate(lastRefreshAt)}</span>
      </div>
    );
  }

  return null;
}