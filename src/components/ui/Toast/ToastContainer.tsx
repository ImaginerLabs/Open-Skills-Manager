import { useUIStore } from '../../../stores/uiStore';
import { Toast } from './Toast';
import styles from './ToastContainer.module.scss';

export function ToastContainer(): React.ReactElement | null {
  const toasts = useUIStore((state) => state.toasts);
  const dismissToast = useUIStore((state) => state.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container} role="alert" aria-live="polite" data-testid="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
