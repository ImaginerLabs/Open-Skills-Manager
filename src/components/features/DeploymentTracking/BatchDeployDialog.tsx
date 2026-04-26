import { X, CheckCircle, Warning, Spinner } from '@phosphor-icons/react';
import type { BatchDeployResult } from '@/hooks/useBatchDeploy';
import styles from './DeploymentTracking.module.scss';

export interface BatchDeployDialogProps {
  isOpen: boolean;
  status: 'idle' | 'deploying' | 'completed' | 'cancelled';
  progress: number;
  total: number;
  currentSkillName?: string;
  result?: BatchDeployResult | null;
  onClose: () => void;
  onCancel?: () => void;
  onRetryFailed?: () => void;
}

export function BatchDeployDialog({
  isOpen,
  status,
  progress,
  total,
  currentSkillName,
  result,
  onClose,
  onCancel,
  onRetryFailed,
}: BatchDeployDialogProps): React.ReactElement | null {
  if (!isOpen) {
    return null;
  }

  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  const renderDeployingContent = (): React.ReactElement => (
    <div className={styles.dialogContent}>
      <div className={styles.progressSection}>
        <Spinner size={32} className={styles.spinner} />
        <h2 className={styles.dialogTitle}>Deploying Skills...</h2>
        {currentSkillName && (
          <p className={styles.currentSkill}>{currentSkillName}</p>
        )}
        <div className={styles.progressInfo}>
          <span className={styles.progressText}>{progress} / {total}</span>
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={total}
          >
            <div className={styles.progressFill} style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </div>
      {onCancel && (
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
        >
          Cancel
        </button>
      )}
    </div>
  );

  const renderCompletedContent = (): React.ReactElement | null => {
    if (!result) return null;

    const hasFailures = result.failed.length > 0;

    return (
      <div className={styles.dialogContent}>
        <div className={styles.resultSection}>
          {hasFailures ? (
            <Warning size={32} className={styles.warningIcon} />
          ) : (
            <CheckCircle size={32} className={styles.successIcon} />
          )}
          <h2 className={styles.dialogTitle}>Deployment Complete</h2>
          <div className={styles.resultStats}>
            {result.success.length > 0 && (
              <span className={styles.successCount}>
                {result.success.length} succeeded
              </span>
            )}
            {result.failed.length > 0 && (
              <span className={styles.failedCount}>
                {result.failed.length} failed
              </span>
            )}
          </div>
          {result.failed.length > 0 && (
            <ul className={styles.failedList}>
              {result.failed.map((item) => (
                <li key={item.skillId} className={styles.failedItem}>
                  <span className={styles.failedSkillName}>{item.skillName}</span>
                  <span className={styles.failedError}>{item.error}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={styles.dialogActions}>
          {hasFailures && onRetryFailed && (
            <button
              type="button"
              className={styles.retryButton}
              onClick={onRetryFailed}
            >
              Retry Failed
            </button>
          )}
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const renderCancelledContent = (): React.ReactElement | null => {
    if (!result) return null;

    return (
      <div className={styles.dialogContent}>
        <div className={styles.resultSection}>
          <X size={32} className={styles.cancelledIcon} />
          <h2 className={styles.dialogTitle}>Deployment Cancelled</h2>
          <div className={styles.resultStats}>
            {result.success.length > 0 && (
              <span className={styles.successCount}>
                {result.success.length} succeeded
              </span>
            )}
            {result.cancelled.length > 0 && (
              <span className={styles.cancelledCount}>
                {result.cancelled.length} cancelled
              </span>
            )}
          </div>
        </div>
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialog} role="dialog" aria-modal="true">
        <button
          type="button"
          className={styles.dialogClose}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {status === 'deploying' && renderDeployingContent()}
        {status === 'completed' && renderCompletedContent()}
        {status === 'cancelled' && renderCancelledContent()}
      </div>
    </div>
  );
}
