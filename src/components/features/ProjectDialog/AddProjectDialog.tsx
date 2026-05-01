import { useState, useCallback } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { X, FolderOpen } from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import styles from './AddProjectDialog.module.scss';

export interface AddProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (path: string) => Promise<void>;
}

export function AddProjectDialog({
  open: isOpen,
  onClose,
  onAdd,
}: AddProjectDialogProps): React.ReactElement {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleSelectFolder = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Project Directory',
      });

      if (selected) {
        const path = typeof selected === 'string' ? selected : null;
        if (path) {
          setSelectedPath(path);
        }
      }
    } catch (e) {
      console.error('Failed to select folder:', e);
    }
  }, []);

  const handleClose = useCallback(() => {
    setSelectedPath(null);
    onClose();
  }, [onClose]);

  const handleAdd = useCallback(async () => {
    if (!selectedPath) return;

    setIsAdding(true);
    try {
      await onAdd(selectedPath);
      handleClose();
    } finally {
      setIsAdding(false);
    }
  }, [selectedPath, onAdd, handleClose]);

  const folderName = selectedPath ? selectedPath.split('/').pop() || selectedPath : null;

  return (
    <Modal open={isOpen} onClose={handleClose} className={styles.dialog}>
      <div className={styles.header}>
        <h2 className={styles.title}>Add Project</h2>
        <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
          <X size={20} weight="bold" />
        </button>
      </div>

      <div className={styles.content}>
        <button className={styles.selectButton} onClick={handleSelectFolder} type="button">
          <span className={styles.selectIcon}>
            <FolderOpen size={32} weight="duotone" />
          </span>
          <span className={styles.selectLabel}>Select Folder</span>
          <span className={styles.selectDescription}>Choose a project directory</span>
        </button>

        {selectedPath && (
          <div className={styles.selectedPath}>
            <FolderOpen size={16} className={styles.pathIcon} />
            <span className={styles.pathName}>{folderName}</span>
            <span className={styles.pathFull}>{selectedPath}</span>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Button variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleAdd} disabled={!selectedPath || isAdding}>
          {isAdding ? 'Adding...' : 'Add Project'}
        </Button>
      </div>
    </Modal>
  );
}
