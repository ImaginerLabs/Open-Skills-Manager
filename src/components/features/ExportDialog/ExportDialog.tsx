import { useState, useCallback, useEffect } from 'react';
import { FileZip, FolderSimple, Export } from '@phosphor-icons/react';
import { Modal, Button, ModalFooter } from '../../ui';
import styles from './ExportDialog.module.scss';

export type ExportFormat = 'zip' | 'folder';

export interface ExportableSkill {
  id: string;
  name: string;
  path?: string;
  scope?: 'library' | 'global' | 'project';
}

export interface ExportDialogProps {
  /** Dialog open state */
  isOpen: boolean;
  /** Skills to export */
  skills: ExportableSkill[];
  /** Close handler */
  onClose: () => void;
  /** Export start handler */
  onExportStart: (format: ExportFormat, skills: ExportableSkill[]) => void;
}

export function ExportDialog({
  isOpen,
  skills,
  onClose,
  onExportStart,
}: ExportDialogProps): React.ReactElement {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('zip');
  const [isExporting, setIsExporting] = useState(false);

  // Reset isExporting when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsExporting(false);
    }
  }, [isOpen]);

  const skillCount = skills.length;
  const isMultiExport = skillCount > 1;

  const handleExport = useCallback(() => {
    setIsExporting(true);
    onExportStart(selectedFormat, skills);
  }, [selectedFormat, skills, onExportStart]);

  const handleClose = useCallback(() => {
    if (!isExporting) {
      onClose();
    }
  }, [isExporting, onClose]);

  const formatOptions: Array<{
    format: ExportFormat;
    icon: React.ReactNode;
    label: string;
    description: string;
  }> = [
    {
      format: 'zip',
      icon: <FileZip size={24} weight="duotone" />,
      label: 'Export as Zip',
      description: 'Create a compressed archive for easy sharing',
    },
    {
      format: 'folder',
      icon: <FolderSimple size={24} weight="duotone" />,
      label: 'Export as Folder',
      description: 'Copy the skill folder with all contents',
    },
  ];

  return (
    <Modal open={isOpen} onClose={handleClose} title="Export Skills" data-testid="export-dialog">
      <div className={styles.content}>
        <p className={styles.description}>
          {isMultiExport
            ? `Export ${skillCount} selected skills`
            : `Export "${skills[0]?.name || 'skill'}"`}
        </p>

        <div className={styles.options}>
          {formatOptions.map((option) => (
            <button
              key={option.format}
              className={`${styles.option} ${selectedFormat === option.format ? styles.optionSelected : ''}`}
              onClick={() => setSelectedFormat(option.format)}
              disabled={isExporting}
              aria-pressed={selectedFormat === option.format}
            >
              <div className={styles.optionIcon}>{option.icon}</div>
              <div className={styles.optionContent}>
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionDescription}>{option.description}</span>
              </div>
              {selectedFormat === option.format && (
                <div className={styles.optionCheck} />
              )}
            </button>
          ))}
        </div>

        {isMultiExport && (
          <div className={styles.batchInfo}>
            <Export size={16} />
            <span>
              {skillCount} skills will be exported as separate{' '}
              {selectedFormat === 'zip' ? 'zip files' : 'folders'}
            </span>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleExport} disabled={isExporting} data-testid="export-confirm-button">
          {isExporting ? 'Exporting...' : `Export ${isMultiExport ? `${skillCount} Skills` : 'Skill'}`}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
