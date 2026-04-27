import { useState, useCallback, useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import type { SkillDetailPanelProps } from './types';
import styles from './SkillList.module.scss';

export function SkillDetailPanel({ isOpen, children, onClose }: SkillDetailPanelProps): React.ReactElement | null {
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

  if (!isOpen) return null;

  return (
    <aside className={[styles.detailPanel, isClosing && styles.closing].filter(Boolean).join(' ')} aria-label="Skill details">
      <div className={styles.detailShadow} />
      {children}
    </aside>
  );
}

export function SkillDetailPanelHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}): React.ReactElement {
  return (
    <header className={styles.detailHeader}>
      <h2 className={styles.detailTitle}>{title}</h2>
      <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close details">
        <X size={20} />
      </button>
    </header>
  );
}

export function SkillDetailPanelContent({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className={styles.detailContent}>{children}</div>;
}

export function SkillDetailPanelFooter({ children }: { children: React.ReactNode }): React.ReactElement {
  return <footer className={styles.detailFooter}>{children}</footer>;
}
