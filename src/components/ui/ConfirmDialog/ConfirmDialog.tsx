import { useUIStore } from '../../../stores/uiStore';
import { Button } from '../Button/Button';
import { Modal } from '../Modal/Modal';
import styles from './ConfirmDialog.module.scss';

export function ConfirmDialog(): React.ReactElement | null {
  const confirmDialog = useUIStore((state) => state.confirmDialog);
  const closeConfirmDialog = useUIStore((state) => state.closeConfirmDialog);

  if (!confirmDialog) return null;

  const { open, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm } = confirmDialog;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    closeConfirmDialog();
  };

  return (
    <Modal open={open} onClose={handleCancel} title={title} className={styles.dialog}>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={handleCancel}>
          {cancelText}
        </Button>
        <Button variant="danger" onClick={handleConfirm}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
