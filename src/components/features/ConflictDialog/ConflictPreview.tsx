import { CloudArrowDown, CloudArrowUp, Files } from '@phosphor-icons/react';
import { formatSize, formatDateTime } from '@/utils/formatters';
import type { ConflictVersion } from '@/services/icloudService';
import styles from './ConflictDialog.module.scss';

export interface ConflictPreviewProps {
  localVersion: ConflictVersion;
  remoteVersion: ConflictVersion;
  skillName: string;
}

export function ConflictPreview({
  localVersion,
  remoteVersion,
  skillName,
}: ConflictPreviewProps): React.ReactElement {
  const renderVersionCard = (
    label: string,
    version: ConflictVersion,
    icon: React.ReactNode,
    variant: 'local' | 'remote'
  ) => (
    <div className={`${styles.versionCard} ${styles[variant]}`}>
      <div className={styles.versionHeader}>
        {icon}
        <span className={styles.versionLabel}>{label}</span>
      </div>
      <div className={styles.versionDetails}>
        <div className={styles.versionRow}>
          <span className={styles.versionKey}>Modified</span>
          <span className={styles.versionValue}>{formatDateTime(version.modifiedTime)}</span>
        </div>
        <div className={styles.versionRow}>
          <span className={styles.versionKey}>Size</span>
          <span className={styles.versionValue}>{formatSize(version.size)}</span>
        </div>
        <div className={styles.versionRow}>
          <span className={styles.versionKey}>Device</span>
          <span className={styles.versionValue}>{version.deviceName}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewHeader}>
        <Files size={16} weight="duotone" />
        <span>{skillName.replace(/^["']|["']$/g, '')}</span>
      </div>
      <div className={styles.versionsGrid}>
        {renderVersionCard(
          'Local Version',
          localVersion,
          <CloudArrowDown size={18} weight="duotone" />,
          'local'
        )}
        {renderVersionCard(
          'Remote Version',
          remoteVersion,
          <CloudArrowUp size={18} weight="duotone" />,
          'remote'
        )}
      </div>
    </div>
  );
}
