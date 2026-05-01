import { CheckCircle, Warning, XCircle, Info, X } from '@phosphor-icons/react';
import type { ToastType, Toast as ToastType_ } from '../../../stores/uiStore';
import styles from './Toast.module.scss';

export interface ToastProps {
  toast: ToastType_;
  onDismiss: (id: string) => void;
}

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} weight="fill" />,
  error: <XCircle size={18} weight="fill" />,
  warning: <Warning size={18} weight="fill" />,
  info: <Info size={18} weight="fill" />,
};

export function Toast({ toast, onDismiss }: ToastProps): React.ReactElement {
  return (
    <div className={[styles.toast, styles[toast.type]].filter(Boolean).join(' ')} data-testid="toast-message">
      <span className={styles.icon}>{iconMap[toast.type]}</span>
      <span className={styles.message}>{toast.message}</span>
      <button
        type="button"
        className={styles.dismissButton}
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
