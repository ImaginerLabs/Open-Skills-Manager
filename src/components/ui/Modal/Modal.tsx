import type { ReactNode, HTMLAttributes, MouseEvent } from 'react';
import { X } from '@phosphor-icons/react';
import styles from './Modal.module.scss';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  /** Modal open state */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children?: ReactNode;
}

export function Modal({ open, onClose, title, children, className, ...props }: ModalProps) {
  if (!open) return null;

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={[styles.content, className].filter(Boolean).join(' ')} {...props}>
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
              <X size={20} weight="bold" />
            </button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function ModalFooter({ className, children, ...props }: ModalFooterProps) {
  return (
    <div className={[styles.footer, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}
