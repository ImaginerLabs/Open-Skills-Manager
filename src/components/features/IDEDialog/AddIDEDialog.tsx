import { useState, useCallback, useMemo } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { X, FolderOpen } from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { IconPicker, getIconByName } from '@/components/ui/IconPicker';
import type { IDEConfig } from '@/stores/ideStore';
import { storageService } from '@/services/storageService';
import styles from './AddIDEDialog.module.scss';

export interface AddIDEDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (ide: IDEConfig) => void;
}

export function AddIDEDialog({
  open: isOpen,
  onClose,
  onAdd,
}: AddIDEDialogProps): React.ReactElement {
  const [name, setName] = useState('');
  const [globalPath, setGlobalPath] = useState('');
  const [projectScope, setProjectScope] = useState('');
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectFolder = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Global Skills Directory',
      });

      if (selected) {
        const path = typeof selected === 'string' ? selected : null;
        if (path) {
          setGlobalPath(path);
        }
      }
    } catch (e) {
      console.error('Failed to select folder:', e);
    }
  }, []);

  const handleAdd = useCallback(async () => {
    if (!name.trim()) {
      setError('Please enter an IDE name');
      return;
    }
    if (!globalPath.trim()) {
      setError('Please select a global skills directory');
      return;
    }
    if (!projectScope.trim()) {
      setError('Please enter a project scope name');
      return;
    }

    setError(null);
    setIsAdding(true);

    try {
      const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const newIDE: IDEConfig = {
        id,
        name: name.trim(),
        globalScopePath: globalPath.trim(),
        projectScopeName: projectScope.trim(),
        projects: [],
        isEnabled: true,
        icon: icon || 'cube',
      };

      await storageService.addIDE(newIDE);
      onAdd(newIDE);
      handleClose();
    } catch (e) {
      console.error('Failed to add IDE:', e);
      setError('Failed to add IDE. Please try again.');
    } finally {
      setIsAdding(false);
    }
  }, [name, globalPath, projectScope, icon, onAdd]);

  const handleClose = useCallback(() => {
    setName('');
    setGlobalPath('');
    setProjectScope('');
    setIcon(undefined);
    setError(null);
    setIsAdding(false);
    onClose();
  }, [onClose]);

  const iconPreview = useMemo(() => getIconByName(icon, 16), [icon]);

  return (
    <Modal open={isOpen} onClose={handleClose} className={styles.dialog}>
      <div className={styles.header}>
        <h2 className={styles.title}>Add Custom IDE</h2>
        <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
          <X size={20} weight="bold" />
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.formGroup}>
          <label className={styles.label}>IDE Name</label>
          <Input
            placeholder="e.g., Windsurf, Aider"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Global Skills Path</label>
          <div className={styles.pathRow}>
            <Input
              className={styles.pathInput}
              placeholder="e.g., ~/.windsurf/skills"
              value={globalPath}
              onChange={(e) => setGlobalPath(e.target.value)}
            />
            <button
              type="button"
              className={styles.selectButton}
              onClick={handleSelectFolder}
              aria-label="Select folder"
            >
              <FolderOpen size={18} />
            </button>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Project Scope Name</label>
          <Input
            placeholder="e.g., .windsurf"
            value={projectScope}
            onChange={(e) => setProjectScope(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Icon</label>
          <IconPicker value={icon} onChange={setIcon} />
          <div className={styles.iconPreview}>
            {iconPreview}
          </div>
        </div>

        {error && <span className={styles.error}>{error}</span>}
      </div>

      <div className={styles.footer}>
        <Button variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleAdd} disabled={isAdding}>
          {isAdding ? 'Adding...' : 'Add IDE'}
        </Button>
      </div>
    </Modal>
  );
}
