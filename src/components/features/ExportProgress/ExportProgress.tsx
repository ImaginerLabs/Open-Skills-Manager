import { useEffect, useCallback } from 'react';
import { Export, X, CheckCircle, Warning, Spinner } from '@phosphor-icons/react';
import { useLibraryStore } from '../../../stores/libraryStore';
import styles from './ExportProgress.module.scss';

export interface ExportProgressProps {
  /** Dialog open state */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
}

export function ExportProgress({ isOpen, onClose }: ExportProgressProps): React.ReactElement | null {
  const exportProgress = useLibraryStore((state) => state.exportProgress);
  const cancelExport = useLibraryStore((state) => state.cancelExport);
  const resetExport = useLibraryStore((state) => state.resetExport);
  const error = useLibraryStore((state) => state.error);

  const { current, total, currentSkillName, status } = exportProgress;
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const isExporting = status === 'exporting';
  const isCompleted = status === 'completed';
  const isCancelled = status === 'cancelled';
  const isError = status === 'error';

  useEffect(() => {
    if (isCompleted && isOpen) {
      const timer = setTimeout(() => {
        onClose();
        resetExport();
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isCompleted, isOpen, onClose, resetExport]);

  const handleCancel = useCallback(() => {
    cancelExport();
    onClose();
    resetExport();
  }, [cancelExport, onClose, resetExport]);

  const handleClose = useCallback(() => {
    if (!isExporting) {
      onClose();
      resetExport();
    }
  }, [isExporting, onClose, resetExport]);

  if (!isOpen) return null;

  const renderStatusIcon = () => {
    if (isExporting) {
      return <Spinner className={styles.spinner} size={20} />;
    }
    if (isCompleted) {
      return <CheckCircle size={20} weight="fill" className={styles.iconSuccess} />;
    }
    if (isCancelled) {
      return <X size={20} weight="bold" className={styles.iconWarning} />;
    }
    if (isError) {
      return <Warning size={20} weight="fill" className={styles.iconError} />;
    }
    return null;
  };

  const renderStatusText = () => {
    if (isExporting) {
      return `Exporting skill ${current} of ${total}`;
    }
    if (isCompleted) {
      return `Exported ${total} skill${total !== 1 ? 's' : ''} successfully`;
    }
    if (isCancelled) {
      return 'Export cancelled';
    }
    if (isError) {
      return 'Export failed';
    }
    return 'Preparing export...';
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Export size={20} weight="duotone" />
            <h2 className={styles.title}>Export Progress</h2>
          </div>
          {!isExporting && (
            <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
              <X size={18} weight="bold" />
            </button>
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.statusRow}>
            {renderStatusIcon()}
            <span className={styles.statusText}>{renderStatusText()}</span>
          </div>

          {isExporting && currentSkillName && (
            <div className={styles.skillName}>
              <span className={styles.skillLabel}>Current:</span>
              <span className={styles.skillValue}>{currentSkillName}</span>
            </div>
          )}

          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${percentage}%` }}
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <span className={styles.percentage}>{percentage}%</span>
          </div>

          {isError && error && (
            <div className={styles.errorBox}>
              <Warning size={16} weight="fill" />
              <span className={styles.errorText}>{error}</span>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {isExporting && (
            <button className={styles.cancelButton} onClick={handleCancel}>
              Cancel Export
            </button>
          )}
          {isCancelled && (
            <button className={styles.closeActionButton} onClick={handleClose}>
              Close
            </button>
          )}
          {isError && (
            <button className={styles.closeActionButton} onClick={handleClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
