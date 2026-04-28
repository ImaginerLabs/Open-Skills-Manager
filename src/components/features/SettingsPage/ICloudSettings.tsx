import {
  ArrowsClockwise,
  FolderOpen,
  Info,
  Warning,
} from '@phosphor-icons/react';
import type { SyncStatusType } from '@/services/icloudService';
import styles from './ICloudSettings.module.scss';

export interface ICloudSettingsProps {
  status: SyncStatusType;
  lastSyncTime?: string | undefined;
  containerPath: string | null;
  isLoading: boolean;
  error: string | null;
  onForceSync: () => Promise<void>;
  onViewInFinder: () => void;
}

function formatLastSync(isoString?: string): string {
  if (!isoString) return 'Never';

  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown';
  }
}

function getStatusLabel(status: SyncStatusType): string {
  switch (status) {
    case 'synced':
      return 'All changes synced';
    case 'syncing':
      return 'Syncing...';
    case 'pending':
      return 'Changes pending';
    case 'offline':
      return 'iCloud unavailable';
    case 'error':
      return 'Sync failed';
    default:
      return 'Unknown';
  }
}

export function ICloudSettings({
  status,
  lastSyncTime,
  containerPath,
  isLoading,
  error,
  onForceSync,
  onViewInFinder,
}: ICloudSettingsProps): React.ReactElement {

  return (
    <section className={styles.iCloudSection}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>iCloud Sync</h2>
      </header>

      <div className={styles.statusContainer}>
        <div className={styles.statusRow}>
          <div className={styles.statusLabel}>
            <span
              className={`${styles.statusDot} ${styles[`statusDot${status.charAt(0).toUpperCase() + status.slice(1)}`]}`}
            />
            <span className={styles.statusText}>{getStatusLabel(status)}</span>
          </div>
          <span className={styles.statusValue}>{formatLastSync(lastSyncTime)}</span>
        </div>

        <div className={styles.infoBox}>
          <Info size={16} className={styles.infoIcon} />
          <p className={styles.infoText}>
            <strong>Only App Library is synced.</strong> Global and Project skills remain local to
            each device.
          </p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <Warning size={14} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.primaryButton}`}
            onClick={onForceSync}
            disabled={isLoading || status === 'syncing'}
          >
            {isLoading || status === 'syncing' ? (
              <ArrowsClockwise size={16} className={styles.loadingIcon} />
            ) : (
              <ArrowsClockwise size={16} />
            )}
            <span>Force Sync Now</span>
          </button>

          <button
            type="button"
            className={styles.actionButton}
            onClick={onViewInFinder}
            disabled={!containerPath}
          >
            <FolderOpen size={16} />
            <span>View in Finder</span>
          </button>
        </div>
      </div>
    </section>
  );
}
