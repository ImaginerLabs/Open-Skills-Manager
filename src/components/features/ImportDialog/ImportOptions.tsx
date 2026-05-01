import type { ReactNode } from 'react';
import { FolderOpen, FileArchive } from '@phosphor-icons/react';
import styles from './ImportOptions.module.scss';

export interface ImportOptionsProps {
  /** Callback when "From Folder" is clicked */
  onSelectFolder: () => void;
  /** Callback when "From Zip" is clicked */
  onSelectZip: () => void;
}

export function ImportOptions({ onSelectFolder, onSelectZip }: ImportOptionsProps): ReactNode {
  return (
    <div className={styles.options}>
      <button className={styles.optionButton} onClick={onSelectFolder} type="button" data-testid="select-folder-button">
        <span className={styles.optionIcon}>
          <FolderOpen size={32} weight="duotone" />
        </span>
        <span className={styles.optionLabel}>From Folder</span>
        <span className={styles.optionDescription}>Select skill folder(s)</span>
      </button>

      <button className={styles.optionButton} onClick={onSelectZip} type="button" data-testid="select-zip-button">
        <span className={styles.optionIcon}>
          <FileArchive size={32} weight="duotone" />
        </span>
        <span className={styles.optionLabel}>From Zip</span>
        <span className={styles.optionDescription}>Select .zip file(s)</span>
      </button>
    </div>
  );
}
