import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CloudCheck,
  CloudArrowUp,
  Cloud,
  CloudSlash,
  Warning,
} from '@phosphor-icons/react';
import type { SyncStatusType } from '@/services/icloudService';
import styles from './ICloudStatus.module.scss';

export interface ICloudStatusProps {
  status: SyncStatusType;
  lastSyncTime?: string | undefined;
  pendingChanges: number;
  onClick?: () => void;
}

function formatLastSync(isoString?: string): string {
  if (!isoString) return 'Never';

  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  } catch {
    return 'Unknown';
  }
}

function getStatusLabel(status: SyncStatusType): string {
  switch (status) {
    case 'synced':
      return 'Synced';
    case 'syncing':
      return 'Syncing...';
    case 'pending':
      return 'Pending';
    case 'offline':
      return 'Offline';
    case 'error':
      return 'Sync Error';
    default:
      return 'Unknown';
  }
}

export function ICloudStatus({
  status,
  lastSyncTime,
  pendingChanges,
  onClick,
}: ICloudStatusProps): React.ReactElement {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      navigate('/settings');
    }
  }, [onClick, navigate]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    }

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  const renderIcon = () => {
    const iconProps = {
      size: 20,
      weight: 'fill' as const,
    };

    switch (status) {
      case 'synced':
        return <CloudCheck {...iconProps} className={styles.synced} />;
      case 'syncing':
        return <CloudArrowUp {...iconProps} className={`${styles.syncing} ${styles.syncingIcon}`} />;
      case 'pending':
        return <Cloud {...iconProps} className={styles.pending} />;
      case 'offline':
        return <CloudSlash {...iconProps} className={styles.offline} />;
      case 'error':
        return <Warning {...iconProps} className={styles.error} />;
      default:
        return <Cloud {...iconProps} className={styles.pending} />;
    }
  };

  return (
    <button
      ref={containerRef}
      type="button"
      className={styles.statusIndicator}
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      aria-label={`iCloud sync status: ${getStatusLabel(status)}`}
    >
      {renderIcon()}

      {showTooltip && (
        <div ref={tooltipRef} className={styles.tooltip} role="tooltip">
          <div className={styles.tooltipHeader}>
            <span
              className={`${styles.statusDot} ${styles[`statusDot${status.charAt(0).toUpperCase() + status.slice(1)}`]}`}
            />
            <span className={styles.tooltipLabel}>{getStatusLabel(status)}</span>
          </div>

          <div className={styles.tooltipContent}>
            <div className={styles.tooltipRow}>
              <span>Last sync</span>
              <span className={styles.tooltipValue}>{formatLastSync(lastSyncTime)}</span>
            </div>

            {pendingChanges > 0 && (
              <div className={styles.tooltipRow}>
                <span>Pending changes</span>
                <span className={styles.tooltipValue}>{pendingChanges}</span>
              </div>
            )}
          </div>

          <div className={styles.clickHint}>Click to open settings</div>
        </div>
      )}
    </button>
  );
}
