import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { FolderOpen, FileArchive, X, Trash, Warning } from '@phosphor-icons/react';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { useLibraryStore, type LibrarySkill } from '@/stores/libraryStore';
import { libraryService } from '@/services/libraryService';
import { DuplicateHandlerDialog } from './DuplicateHandlerDialog';
import { selectFolders, selectZipFiles, validateFolderName, processDroppedPaths } from './importUtils';
import styles from './ImportDialog.module.scss';

export interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportStart?: (paths: string[], categoryId?: string | undefined, groupId?: string | undefined) => void;
  selectedCategoryId?: string | undefined;
  selectedGroupId?: string | undefined;
}

export interface ImportItem {
  id: string;
  path: string;
  name: string;
  type: 'folder' | 'zip';
  status: 'pending' | 'validating' | 'valid' | 'invalid' | 'duplicate';
  error?: string;
  errorCode?: string;
}

export interface DuplicateSkill {
  name: string;
  folderName: string;
  version: string;
  path: string;
}

const MAX_SKILL_SIZE_MB = 10;

const VALIDATION_ERRORS = {
  E201: 'Missing SKILL.md file at root level',
  E202: 'Invalid folder name. Use alphanumeric characters, hyphens, or underscores only.',
  E203: `Skill size exceeds ${MAX_SKILL_SIZE_MB}MB limit`,
} as const;

export function ImportDialog({ isOpen, onClose, onImportStart, selectedCategoryId, selectedGroupId }: ImportDialogProps): ReactNode {
  const [items, setItems] = useState<ImportItem[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    item: ImportItem;
    existing: DuplicateSkill;
  } | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const addSkill = useLibraryStore((state) => state?.addSkill);
  const removeSkill = useLibraryStore((state) => state?.removeSkill);
  const skills = useLibraryStore((state) => state?.skills);
  const existingSkills = useMemo(
    () => (Array.isArray(skills) ? skills.filter((s): s is LibrarySkill => s != null && s.folderName != null) : []),
    [skills]
  );

  // Tauri native drag-drop event listener
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupDragDrop = async () => {
      unlisten = await getCurrentWebview().onDragDropEvent((event) => {
        if (!isOpen) return;

        if (event.payload.type === 'over') {
          setIsDragOver(true);
        } else if (event.payload.type === 'drop') {
          setIsDragOver(false);
          const newItems = processDroppedPaths(event.payload.paths);
          setItems((prev) => [...prev, ...newItems]);
        } else {
          // cancel
          setIsDragOver(false);
        }
      });
    };

    setupDragDrop();

    return () => {
      unlisten?.();
    };
  }, [isOpen]);

  const handleSelectFolder = useCallback(async () => {
    const newItems = await selectFolders();
    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
  }, []);

  const handleSelectZip = useCallback(async () => {
    const newItems = await selectZipFiles();
    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDuplicateAction = useCallback(
    async (action: 'skip' | 'replace' | 'rename') => {
      if (!duplicateInfo) return;

      const { item, existing } = duplicateInfo;

      if (action === 'skip') {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setDuplicateInfo(null);
        return;
      }

      setDuplicateInfo(null);

      if (action === 'replace') {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'validating' } : i
          )
        );

        const existingSkill = existingSkills.find(
          (skill) => skill.folderName.toLowerCase() === existing.folderName.toLowerCase()
        );
        if (existingSkill) {
          removeSkill(existingSkill.id);
        }

        const result = await libraryService.import({ path: item.path });

        if (result.success) {
          addSkill(result.data);
          setItems((prev) => prev.filter((i) => i.id !== item.id));
        } else {
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, status: 'invalid', error: result.error.message, errorCode: result.error.code }
                : i
            )
          );
        }
        return;
      }

      if (action === 'rename') {
        const renamedItem = { ...item, name: `${item.name}-copy`, status: 'pending' as const };
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? renamedItem : i
          )
        );
      }
    },
    [duplicateInfo, existingSkills, removeSkill, addSkill]
  );

  const handleImport = useCallback(async () => {
    if (items.length === 0) return;

    setIsValidating(true);
    const validItems = items.filter((item) => item.status === 'pending');
    const paths: string[] = [];

    for (const item of validItems) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'validating' } : i))
      );

      if (!validateFolderName(item.name)) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'invalid', error: VALIDATION_ERRORS.E202, errorCode: 'E202' }
              : i
          )
        );
        continue;
      }

      const existingSkill = existingSkills.find(
        (skill) => skill.folderName.toLowerCase() === item.name.toLowerCase()
      );
      if (existingSkill) {
        setDuplicateInfo({
          item,
          existing: {
            name: existingSkill.name,
            folderName: existingSkill.folderName,
            version: existingSkill.version,
            path: existingSkill.path,
          },
        });
        setIsValidating(false);
        return;
      }

      paths.push(item.path);
    }

    setIsValidating(false);

    if (paths.length > 0) {
      onImportStart?.(paths, selectedCategoryId, selectedGroupId);
      setItems([]);
      onClose();
    }
  }, [items, existingSkills, onImportStart, onClose, selectedCategoryId, selectedGroupId]);

  const handleClose = useCallback(() => {
    setItems([]);
    setDuplicateInfo(null);
    onClose();
  }, [onClose]);

  const validItems = items.filter((item) => item.status !== 'invalid');
  const hasInvalidItems = items.some((item) => item.status === 'invalid');

  return (
    <>
      <Modal open={isOpen} onClose={handleClose} className={styles.dialog}>
        <div className={styles.header}>
          <h2 className={styles.title}>Import Skills</h2>
          <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.options}>
            <button className={styles.optionButton} onClick={handleSelectFolder} type="button">
              <span className={styles.optionIcon}>
                <FolderOpen size={32} weight="duotone" />
              </span>
              <span className={styles.optionLabel}>From Folder</span>
              <span className={styles.optionDescription}>Select skill folder(s)</span>
            </button>

            <button className={styles.optionButton} onClick={handleSelectZip} type="button">
              <span className={styles.optionIcon}>
                <FileArchive size={32} weight="duotone" />
              </span>
              <span className={styles.optionLabel}>From Zip</span>
              <span className={styles.optionDescription}>Select .zip file(s)</span>
            </button>
          </div>

          <div
            ref={dropZoneRef}
            className={`${styles.dropZone}${isDragOver ? ` ${styles.active}` : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <span className={styles.dropIcon}>
              <FolderOpen size={24} weight="duotone" />
            </span>
            <span className={styles.dropText}>Drag and drop skill folders or zip files</span>
            <span className={styles.dropHint}>Supports multiple selection</span>
          </div>

          {items.length > 0 && (
            <div className={styles.selectedFiles}>
              <div className={styles.fileList}>
                {items.map((item) => (
                  <div key={item.id} className={styles.fileItem}>
                    <span className={styles.fileIcon}>
                      {item.type === 'folder' ? <FolderOpen size={16} /> : <FileArchive size={16} />}
                    </span>
                    <span className={styles.fileName}>{item.name}</span>
                    {item.status === 'invalid' && (
                      <span style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)' }}>
                        {item.error}
                      </span>
                    )}
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label="Remove"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasInvalidItems && (
            <div className={styles.validationError}>
              <Warning size={16} className={styles.errorIcon} />
              <span className={styles.errorMessage}>
                Some items have validation errors and will be skipped.
              </span>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={validItems.length === 0 || isValidating}
          >
            {isValidating
              ? 'Validating...'
              : `Import ${validItems.length} Skill${validItems.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </Modal>

      <DuplicateHandlerDialog
        duplicateInfo={duplicateInfo}
        onAction={handleDuplicateAction}
        onClose={() => setDuplicateInfo(null)}
      />
    </>
  );
}