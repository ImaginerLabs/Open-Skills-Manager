import { useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { IconPicker } from '@/components/ui/IconPicker';
import styles from './CreateEntityDialog.module.scss';

export interface CreateEntityDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, icon?: string, notes?: string) => void;

  entityType: 'group' | 'category' | 'project';
  parentName?: string | undefined;

  title?: string;
  namePlaceholder?: string;
  notesPlaceholder?: string;
}

export function CreateEntityDialog({
  open,
  onClose,
  onCreate,
  entityType,
  parentName,
  title,
  namePlaceholder,
  notesPlaceholder,
}: CreateEntityDialogProps): React.ReactElement {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');

  const defaultTitle = parentName
    ? `Create ${entityType} in ${parentName}`
    : `Create ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;
  const defaultNamePlaceholder = `Enter ${entityType} name`;
  const defaultNotesPlaceholder = `Add notes about this ${entityType}`;

  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;
    onCreate(name.trim(), icon, notes.trim() || undefined);
    setName('');
    setIcon(undefined);
    setNotes('');
    onClose();
  }, [name, icon, notes, onCreate, onClose]);

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
    <Modal open={open} onClose={handleClose} title={title ?? defaultTitle} className={styles.dialog}>
      <div className={styles.form}>
        <div className={styles.field}>
          <Input
            label="Name"
            placeholder={namePlaceholder ?? defaultNamePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <Input
            label="Notes (optional)"
            placeholder={notesPlaceholder ?? defaultNotesPlaceholder}
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
