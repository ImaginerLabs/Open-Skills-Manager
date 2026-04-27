import { CloudWarning, Gear, ArrowClockwise } from '@phosphor-icons/react';
import { Modal, ModalFooter } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import styles from './QuotaExceededDialog.module.scss';

export interface QuotaExceededDialogProps {
  open: boolean;
  usedBytes: number;
  totalBytes: number;
  onClose: () => void;
  onOpenSettings: () => void;
  onWorkOffline: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

export function QuotaExceededDialog({
  open,
  usedBytes,
  totalBytes,
  onClose,
  onOpenSettings,
  onWorkOffline,
}: QuotaExceededDialogProps): React.ReactElement {
  const usedPercent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

  return (
    <Modal open={open} onClose={onClose} title="iCloud Storage Full">
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <CloudWarning size={48} weight="duotone" />
        </div>

        <p className={styles.description}>
          Your iCloud storage is full. Sync has been paused until space is available.
        </p>

        <div className={styles.storageBreakdown}>
          <div className={styles.storageHeader}>
            <span className={styles.storageLabel}>Storage Used</span>
            <span className={styles.storageValue}>
              {formatBytes(usedBytes)} / {formatBytes(totalBytes)}
            </span>
          </div>
          <div className={styles.storageBar}>
            <div
              className={styles.storageFill}
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            />
          </div>
          <p className={styles.storageNote}>
            Skills data uses {formatBytes(usedBytes)} of your iCloud storage.
          </p>
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onWorkOffline}>
          <ArrowClockwise size={16} />
          Work Offline
        </Button>
        <Button variant="primary" onClick={onOpenSettings}>
          <Gear size={16} />
          Open iCloud Settings
        </Button>
      </ModalFooter>
    </Modal>
  );
}
