import { useState, useCallback } from 'react';
import { Warning, Check, Copy } from '@phosphor-icons/react';
import { Modal, ModalFooter } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { ConflictPreview } from './ConflictPreview';
import type { ConflictInfo, ConflictResolution } from '@/services/icloudService';
import styles from './ConflictDialog.module.scss';

export interface ConflictDialogProps {
  open: boolean;
  conflict: ConflictInfo | null;
  onClose: () => void;
  onResolve: (skillId: string, resolution: ConflictResolution) => Promise<void>;
}

export function ConflictDialog({
  open,
  conflict,
  onClose,
  onResolve,
}: ConflictDialogProps): React.ReactElement {
  const [selectedResolution, setSelectedResolution] = useState<ConflictResolution | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = useCallback(async () => {
    if (!conflict || !selectedResolution) return;

    setIsResolving(true);
    try {
      await onResolve(conflict.skillId, selectedResolution);
      onClose();
    } finally {
      setIsResolving(false);
    }
  }, [conflict, selectedResolution, onResolve, onClose]);

  const handleClose = useCallback(() => {
    setSelectedResolution(null);
    onClose();
  }, [onClose]);

  if (!conflict) return <></>;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Sync Conflict: ${conflict.skillName}`}
      className={styles.conflictModal}
    >
      <div className={styles.content}>
        <div className={styles.warningBanner}>
          <Warning size={20} weight="fill" />
          <span>
            This skill has been modified on multiple devices. Choose which version to keep.
          </span>
        </div>

        <ConflictPreview
          localVersion={conflict.localVersion}
          remoteVersion={conflict.remoteVersion}
          skillName={conflict.skillName}
        />

        <div className={styles.resolutionOptions}>
          <h3 className={styles.optionsTitle}>Resolution</h3>

          <button
            type="button"
            className={`${styles.optionButton} ${selectedResolution === 'local' ? styles.selected : ''}`}
            onClick={() => setSelectedResolution('local')}
          >
            <div className={styles.optionContent}>
              <Check size={18} weight={selectedResolution === 'local' ? 'bold' : 'regular'} />
              <div className={styles.optionText}>
                <span className={styles.optionLabel}>Keep Local</span>
                <span className={styles.optionDesc}>Use your local version, discard remote changes</span>
              </div>
            </div>
          </button>

          <button
            type="button"
            className={`${styles.optionButton} ${selectedResolution === 'remote' ? styles.selected : ''}`}
            onClick={() => setSelectedResolution('remote')}
          >
            <div className={styles.optionContent}>
              <Check size={18} weight={selectedResolution === 'remote' ? 'bold' : 'regular'} />
              <div className={styles.optionText}>
                <span className={styles.optionLabel}>Keep Remote</span>
                <span className={styles.optionDesc}>Use the iCloud version, discard local changes</span>
              </div>
            </div>
          </button>

          <button
            type="button"
            className={`${styles.optionButton} ${selectedResolution === 'both' ? styles.selected : ''}`}
            onClick={() => setSelectedResolution('both')}
          >
            <div className={styles.optionContent}>
              <Copy size={18} weight={selectedResolution === 'both' ? 'bold' : 'regular'} />
              <div className={styles.optionText}>
                <span className={styles.optionLabel}>Keep Both</span>
                <span className={styles.optionDesc}>
                  Rename remote version to "{conflict.skillName} (from {conflict.remoteVersion.deviceName})"
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleResolve}
          disabled={!selectedResolution || isResolving}
        >
          {isResolving ? 'Resolving...' : 'Resolve Conflict'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
