import { X } from '@phosphor-icons/react';
import { Modal, Button } from '../../ui';

interface ProgressDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  current: number;
  total: number;
  currentOperation?: string;
  successCount: number;
  errorCount: number;
  onCancel?: () => void;
}

export function ProgressDialog({
  open,
  onClose,
  title,
  current,
  total,
  currentOperation,
  successCount,
  errorCount,
  onCancel,
}: ProgressDialogProps): React.ReactElement {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="progress-dialog">
        <div className="progress-dialog__bar">
          <div className="progress-dialog__fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-dialog__info">
          <span>{currentOperation || `Processing ${current} of ${total}`}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-dialog__counts">
          <span className="progress-dialog__success">Success: {successCount}</span>
          <span className="progress-dialog__error">Errors: {errorCount}</span>
        </div>
        {onCancel && (
          <div className="progress-dialog__actions">
            <Button variant="secondary" onClick={onCancel}>
              <X size={16} />
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
