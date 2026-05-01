import { Warning } from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import type { ImportItem, DuplicateSkill } from './ImportDialog';
import styles from './ImportDialog.module.scss';

export interface DuplicateHandlerDialogProps {
  duplicateInfo: {
    item: ImportItem;
    existing: DuplicateSkill;
  } | null;
  onAction: (action: 'skip' | 'replace' | 'rename') => void;
  onClose: () => void;
}

export function DuplicateHandlerDialog({
  duplicateInfo,
  onAction,
  onClose,
}: DuplicateHandlerDialogProps): React.ReactNode {
  if (!duplicateInfo) return null;

  return (
    <Modal open={true} onClose={onClose} className={styles.duplicateDialog} data-testid="duplicate-handler-dialog">
      <div className={styles.duplicateHeader}>
        <Warning size={24} className={styles.warningIcon} />
        <h3 className={styles.duplicateTitle}>Duplicate Skill Detected</h3>
      </div>

      <p className={styles.duplicateMessage}>
        A skill with the same folder name already exists in your library.
      </p>

      <div className={styles.duplicatePreview}>
        <div className={styles.previewLabel}>Existing skill:</div>
        <div className={styles.previewName}>{duplicateInfo.existing.name.replace(/^["']|["']$/g, '')}</div>
        <div className={styles.previewMeta}>
          <span>{duplicateInfo.existing.folderName}</span>
        </div>
      </div>

      <div className={styles.duplicateActions}>
        <Button variant="ghost" onClick={() => onAction('skip')} data-testid="duplicate-skip-button">
          Skip
        </Button>
        <Button variant="secondary" onClick={() => onAction('rename')} data-testid="duplicate-rename-button">
          Rename
        </Button>
        <Button variant="danger" onClick={() => onAction('replace')} data-testid="duplicate-replace-button">
          Replace
        </Button>
      </div>
    </Modal>
  );
}