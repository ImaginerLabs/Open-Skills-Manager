import { useState, useCallback } from 'react';
import { FolderOpen } from '@phosphor-icons/react';
import { Modal } from '../../ui/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import type { GlobalSkill } from '../../../stores/globalStore';
import { libraryService } from '../../../services/libraryService';
import { useLibraryStore } from '../../../stores/libraryStore';
import { useUIStore } from '../../../stores/uiStore';
import styles from './GlobalSkillsView.module.scss';

export interface PullToLibraryDialogProps {
  isOpen: boolean;
  skill: GlobalSkill | null;
  onClose: () => void;
  onComplete: () => void;
}

export function PullToLibraryDialog({
  isOpen,
  skill,
  onClose,
  onComplete,
}: PullToLibraryDialogProps): React.ReactElement | null {
  const [isPulling, setIsPulling] = useState(false);
  const { showToast } = useUIStore();
  const { setSkills, setLoading } = useLibraryStore();

  const handlePull = useCallback(async () => {
    if (!skill) return;

    setIsPulling(true);
    try {
      const result = await libraryService.import({ path: skill.path });
      if (result.success) {
        showToast('success', `Skill "${skill.name}" pulled to Library`);

        // Refresh Library list
        setLoading(true);
        const listResult = await libraryService.list();
        if (listResult.success) {
          setSkills(listResult.data);
        }
        setLoading(false);

        onComplete();
      } else {
        showToast('error', `Failed to pull: ${result.error.message}`);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      showToast('error', `Failed to pull: ${message}`);
    } finally {
      setIsPulling(false);
    }
  }, [skill, showToast, setSkills, setLoading, onComplete]);

  if (!skill) return null;

  return (
    <Modal open={isOpen} onClose={onClose} title="Pull to Library" className={styles.pullDialog}>
      <div className={styles.pullContent}>
        <div className={styles.pullIcon}>
          <FolderOpen size={32} />
        </div>
        <p className={styles.pullMessage}>
          Pull <strong>{skill.name}</strong> from Global Skills to your Library?
        </p>
        <p className={styles.pullHint}>
          This will copy the skill to your iCloud-synced Library folder.
        </p>
      </div>
      <div className={styles.pullActions}>
        <Button variant="secondary" onClick={onClose} disabled={isPulling}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handlePull} disabled={isPulling}>
          {isPulling ? 'Pulling...' : 'Pull to Library'}
        </Button>
      </div>
    </Modal>
  );
}
