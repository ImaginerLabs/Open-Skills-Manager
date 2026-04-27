import { useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { IconPicker } from '@/components/ui/IconPicker';
import styles from './CreateGroupDialog.module.scss';

export interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, icon?: string, notes?: string) => void;
}

export function CreateGroupDialog({
  open,
  onClose,
  onCreate,
}: CreateGroupDialogProps): React.ReactElement {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');

  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;
    onCreate(name.trim(), icon, notes.trim() || undefined);
    handleClose();
  }, [name, icon, notes, onCreate]);

  const handleClose = useCallback(() => {
    setName('');
    setIcon(undefined);
    setNotes('');
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && name.trim()) {
        handleSubmit();
      }
    },
    [name, handleSubmit]
  );

  return (
    <Modal open={open} onClose={handleClose} title="Create Group" className={styles.dialog}>
      <div className={styles.form}>
        <div className={styles.field}>
          <Input
            label="Name"
            placeholder="Enter group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <Input
            label="Notes (optional)"
            placeholder="Add notes about this group"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <IconPicker label="Icon (optional)" value={icon} onChange={setIcon} />
        </div>
      </div>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!name.trim()}>
          Create
        </Button>
      </div>
    </Modal>
  );
}
