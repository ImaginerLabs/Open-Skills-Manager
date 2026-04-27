import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { FolderOpen } from '@phosphor-icons/react';
import styles from './DropZone.module.scss';

export interface DropZoneProps {
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
}

export const DropZone = forwardRef<HTMLDivElement, DropZoneProps>(
  function DropZone({ isDragOver, onDragOver, onDragLeave }, ref): ReactNode {
    const className = `${styles.dropZone}${isDragOver ? ` ${styles.active}` : ''}`;

    return (
      <div
        ref={ref}
        className={className}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <span className={styles.dropIcon}>
          <FolderOpen size={24} weight="duotone" />
        </span>
        <span className={styles.dropText}>Drag and drop skill folders or zip files</span>
        <span className={styles.dropHint}>Supports multiple selection</span>
      </div>
    );
  }
);
