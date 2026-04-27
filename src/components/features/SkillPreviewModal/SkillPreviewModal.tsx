import { useEffect, useCallback, useState } from 'react';
import { X, Trash, ArrowDown, FolderOpen } from '@phosphor-icons/react';
import { Modal } from '../../ui/Modal/Modal';
import { formatSize } from '../../../utils/formatters';
import styles from './SkillPreviewModal.module.scss';

export interface SkillPreviewData {
  id?: string;
  name: string;
  description?: string;
  size?: number;
  fileCount?: number;
  date?: string | undefined;
  sourceLibrarySkillId?: string | undefined;
}

export interface SkillPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill: SkillPreviewData | null;
  skillMdContent: string;
  onDelete?: (skillId: string) => void;
  onPull?: (skillId: string) => void;
}

export function SkillPreviewModal({
  isOpen,
  onClose,
  skill,
  skillMdContent,
  onDelete,
  onPull,
}: SkillPreviewModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!skill) return null;

  const formattedDate = skill.date || 'Unknown';
  const formattedSize = skill.size ? formatSize(skill.size) : 'Unknown';
  const displayName = skill.name.replace(/^["']|["']$/g, '');

  return (
    <Modal open={isOpen && !isClosing} onClose={handleClose} className={styles.modal}>
      <div className={styles.header}>
        <h2 className={styles.title}>{displayName}</h2>
        <button
          type="button"
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close preview"
        >
          <X size={20} />
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.metadata}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Date</span>
            <span className={styles.metaValue}>{formattedDate}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Size</span>
            <span className={styles.metaValue}>{formattedSize}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Files</span>
            <span className={styles.metaValue}>{skill.fileCount ?? 'Unknown'}</span>
          </div>
        </div>

        {'sourceLibrarySkillId' in skill && skill.sourceLibrarySkillId && (
          <div className={styles.source}>
            <h3 className={styles.sectionTitle}>
              <FolderOpen size={14} />
              <span>Source</span>
            </h3>
            <p className={styles.sourceText}>Imported from Library</p>
          </div>
        )}

        <div className={styles.markdown}>
          <h3 className={styles.sectionTitle}>SKILL.md</h3>
          <pre className={styles.markdownContent}>
            {skillMdContent || 'No SKILL.md content available'}
          </pre>
        </div>
      </div>

      {(onDelete || onPull) && skill.id && (
        <div className={styles.footer}>
          {onDelete && (
            <button
              type="button"
              className={styles.deleteButton}
              onClick={() => {
                onDelete(skill.id!);
                handleClose();
              }}
            >
              <Trash size={16} />
              <span>Delete</span>
            </button>
          )}
          {onPull && (
            <button
              type="button"
              className={styles.pullButton}
              onClick={() => {
                onPull(skill.id!);
                handleClose();
              }}
            >
              <ArrowDown size={16} />
              <span>Pull to Library</span>
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}