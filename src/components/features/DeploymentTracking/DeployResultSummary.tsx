import { CheckCircle, Warning, ArrowCounterClockwise } from '@phosphor-icons/react';
import type { BatchDeployResult } from '@/hooks/useBatchDeploy';
import styles from './DeploymentTracking.module.scss';

export interface DeployResultSummaryProps {
  result: BatchDeployResult;
  onUndoAll?: () => void;
}

export function DeployResultSummary({ result, onUndoAll }: DeployResultSummaryProps): React.ReactElement {
  const { success, failed, cancelled } = result;
  const total = success.length + failed.length + cancelled.length;

  if (total === 0) {
    return (
      <div className={styles.resultSummary}>
        <p className={styles.emptySummary}>No deployments</p>
      </div>
    );
  }

  const showUndo = onUndoAll !== undefined && success.length > 0;

  return (
    <div className={styles.resultSummary}>
      <div className={styles.summaryStats}>
        {success.length > 0 && (
          <div className={styles.summaryItem}>
            <CheckCircle
              size={16}
              weight="fill"
              className={styles.successIcon}
              role="img"
              aria-label="success"
            />
            <span className={styles.summaryCount}>
              {success.length} deployed
            </span>
          </div>
        )}

        {failed.length > 0 && (
          <div className={styles.summaryItem}>
            <Warning
              size={16}
              weight="fill"
              className={styles.warningIcon}
              role="img"
              aria-label="warning"
            />
            <span className={styles.summaryCount}>
              {failed.length} failed
            </span>
          </div>
        )}

        {cancelled.length > 0 && (
          <div className={styles.summaryItem}>
            <ArrowCounterClockwise
              size={16}
              className={styles.cancelledIcon}
              role="img"
              aria-label="cancelled"
            />
            <span className={styles.summaryCount}>
              {cancelled.length} cancelled
            </span>
          </div>
        )}
      </div>

      {showUndo && (
        <button
          type="button"
          className={styles.undoButton}
          onClick={onUndoAll}
          aria-label="Undo all deployments"
        >
          <ArrowCounterClockwise size={14} />
          <span>Undo All</span>
        </button>
      )}
    </div>
  );
}