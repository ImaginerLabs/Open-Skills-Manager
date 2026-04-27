import { useState, useCallback, useEffect } from 'react';
import { WifiSlash, X } from '@phosphor-icons/react';
import styles from './OfflineBanner.module.scss';

export interface OfflineBannerProps {
  isOffline: boolean;
  pendingChangesCount: number;
  onDismiss?: () => void;
}

export function OfflineBanner({
  isOffline,
  pendingChangesCount,
  onDismiss,
}: OfflineBannerProps): React.ReactElement | null {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  useEffect(() => {
    if (isOffline) {
      setIsDismissed(false);
    }
  }, [isOffline]);

  if (!isOffline || isDismissed) {
    return null;
  }

  const message =
    pendingChangesCount > 0
      ? `${pendingChangesCount} change${pendingChangesCount > 1 ? 's' : ''} saved locally. Will sync when online.`
      : 'Changes saved locally. Will sync when online.';

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <WifiSlash size={18} weight="duotone" />
        <span className={styles.text}>{message}</span>
      </div>
      <button
        type="button"
        className={styles.dismissButton}
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
