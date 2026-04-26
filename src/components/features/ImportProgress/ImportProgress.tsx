import type { ReactNode } from 'react';
import { useState } from 'react';
import { X, CheckCircle, Warning, Stop, ArrowClockwise, CaretDown, CaretUp } from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { useLibraryStore, type ImportProgress } from '@/stores/libraryStore';
import styles from './ImportProgress.module.scss';

export interface ImportProgressProps {
  isOpen: boolean;
  onCancel: () => void;
  onRetry?: (failedItems: ImportProgress['failedItems']) => void;
  onClose: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  E201: 'Missing SKILL.md file at root level',
  E202: 'Invalid folder name. Use alphanumeric characters, hyphens, or underscores only.',
  E203: 'Skill size exceeds 10MB limit',
  IMPORT_ERROR: 'An unexpected error occurred during import',
};

export function ImportProgress({
  isOpen,
  onCancel,
  onRetry,
  onClose,
}: ImportProgressProps): ReactNode {
  const importProgress = useLibraryStore((state) => state.importProgress);
  const cancelImport = useLibraryStore((state) => state.cancelImport);
  const resetImport = useLibraryStore((state) => state.resetImport);
  const [isFailedListExpanded, setIsFailedListExpanded] = useState(false);

  const {
    current,
    total,
    currentSkillName,
    status,
    successful,
    failed,
    skipped,
    failedItems,
  } = importProgress;

  const progressPercent = total > 0 ? Math.round((current / total) * 100) : 0;
  const isImporting = status === 'importing';
  const isCompleted = status === 'completed';
  const isCancelled = status === 'cancelled';
  const isError = status === 'error';
  const hasFailedItems = failedItems.length > 0;

  const handleCancel = () => {
    cancelImport();
    onCancel();
  };

  const handleRetry = () => {
    if (onRetry && hasFailedItems) {
      onRetry(failedItems);
    }
  };

  const handleClose = () => {
    resetImport();
    onClose();
  };

  const getStatusIcon = () => {
    if (isError) return <Warning size={48} weight="duotone" className={styles.statusIconError} />;
    if (isCancelled) return <Stop size={48} weight="duotone" className={styles.statusIconWarning} />;
    if (failed > 0 && isCompleted) return <Warning size={48} weight="duotone" className={styles.statusIconWarning} />;
    return <CheckCircle size={48} weight="duotone" className={styles.statusIconSuccess} />;
  };

  const getStatusTitle = () => {
    if (isImporting) return 'Importing Skills';
    if (isError) return 'Import Failed';
    if (isCancelled) return 'Import Cancelled';
    if (failed > 0 && isCompleted) return 'Import Completed with Errors';
    if (skipped > 0) return 'Import Completed';
    return `All ${total} Skills Imported Successfully`;
  };

  const getErrorMessage = (code: string) => {
    return ERROR_MESSAGES[code] ?? 'Unknown error';
  };

  return (
    <Modal open={isOpen} onClose={handleClose} className={styles.modal}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{getStatusTitle()}</h2>
          <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
            <X size={20} weight="bold" />
          </button>
        </div>

        {isImporting ? (
          <>
            <div className={styles.progressSection}>
              <div className={styles.progressInfo}>
                <span className={styles.progressText}>
                  Importing skill {current} of {total}
                </span>
                <span className={styles.progressPercent}>{progressPercent}%</span>
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {currentSkillName && (
                <div className={styles.currentSkill}>
                  <span className={styles.currentLabel}>Current:</span>
                  <span className={styles.currentName}>{currentSkillName}</span>
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <Button variant="secondary" onClick={handleCancel} type="button">
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.resultSection}>
              <div className={styles.statusIcon}>{getStatusIcon()}</div>

              <div className={styles.summary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Successful</span>
                  <span className={styles.summaryValueSuccess}>{successful}</span>
                </div>
                {failed > 0 && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Failed</span>
                    <span className={styles.summaryValueError}>{failed}</span>
                  </div>
                )}
                {skipped > 0 && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Skipped</span>
                    <span className={styles.summaryValueWarning}>{skipped}</span>
                  </div>
                )}
                {isCancelled && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Cancelled</span>
                    <span className={styles.summaryValueWarning}>{total - current}</span>
                  </div>
                )}
              </div>

              {hasFailedItems && (
                <div className={styles.failedList}>
                  <div className={styles.failedHeader}>
                    <Warning size={16} weight="fill" />
                    <span>Failed Imports</span>
                  </div>
                  <ul className={styles.failedItems}>
                    {failedItems.slice(0, isFailedListExpanded || failedItems.length <= 3 ? undefined : 3).map((item, index) => (
                      <li key={`${item.name}-${index}`} className={styles.failedItem}>
                        <span className={styles.failedName}>{item.name}</span>
                        <span className={styles.failedCode}>{item.code}</span>
                        <span className={styles.failedError}>{getErrorMessage(item.code)}</span>
                      </li>
                    ))}
                  </ul>
                  {failedItems.length > 3 && (
                    <button
                      type="button"
                      className={styles.expandButton}
                      onClick={() => setIsFailedListExpanded(!isFailedListExpanded)}
                    >
                      {isFailedListExpanded ? (
                        <>
                          <CaretUp size={14} />
                          <span>Show less</span>
                        </>
                      ) : (
                        <>
                          <CaretDown size={14} />
                          <span>Show all {failedItems.length} failed items</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {isError && !hasFailedItems && (
                <div className={styles.errorMessage}>
                  <Warning size={16} weight="fill" />
                  <span>An unexpected error occurred during import</span>
                </div>
              )}
            </div>

            <div className={styles.actions}>
              {hasFailedItems && onRetry && (
                <Button variant="secondary" onClick={handleRetry} type="button">
                  <ArrowClockwise size={16} />
                  Retry Failed
                </Button>
              )}
              <Button variant="primary" onClick={handleClose} type="button">
                Done
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}