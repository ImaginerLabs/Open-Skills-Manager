import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportDialog } from '@/components/features/ImportDialog/ImportDialog';

// Mock Tauri dialog plugin
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}));

// Mock library service
vi.mock('@/services/libraryService', () => ({
  libraryService: {
    import: vi.fn(),
    export: vi.fn(),
    categories: { create: vi.fn(), rename: vi.fn(), delete: vi.fn() },
  },
}));

// Mock useLibraryStore
vi.mock('@/stores/libraryStore', () => ({
  useLibraryStore: vi.fn((selector) => {
    const state = {
      skills: [],
      addSkill: vi.fn(),
      removeSkill: vi.fn(),
    };
    return selector(state);
  }),
}));

// Mock CSS modules
vi.mock('@/components/features/ImportDialog/ImportDialog.module.scss', () => ({
  default: {
    dialog: 'dialog',
    header: 'header',
    title: 'title',
    closeButton: 'closeButton',
    content: 'content',
    options: 'options',
    optionButton: 'optionButton',
    optionIcon: 'optionIcon',
    optionLabel: 'optionLabel',
    optionDescription: 'optionDescription',
    dropZone: 'dropZone',
    active: 'active',
    dropIcon: 'dropIcon',
    dropText: 'dropText',
    dropHint: 'dropHint',
    selectedFiles: 'selectedFiles',
    fileList: 'fileList',
    fileItem: 'fileItem',
    fileIcon: 'fileIcon',
    fileName: 'fileName',
    removeButton: 'removeButton',
    validationError: 'validationError',
    errorIcon: 'errorIcon',
    errorMessage: 'errorMessage',
    footer: 'footer',
    duplicateDialog: 'duplicateDialog',
    duplicateHeader: 'duplicateHeader',
    duplicateTitle: 'duplicateTitle',
    duplicateMessage: 'duplicateMessage',
    duplicatePreview: 'duplicatePreview',
    duplicateActions: 'duplicateActions',
  },
}));

vi.mock('@/components/features/ImportDialog/DuplicateHandlerDialog', () => ({
  DuplicateHandlerDialog: vi.fn(() => null),
}));

vi.mock('@/components/ui/Modal/Modal', () => ({
  Modal: vi.fn(({ children, open }) => (open ? <div data-testid="modal">{children}</div> : null)),
}));

vi.mock('@/components/ui/Button/Button', () => ({
  Button: vi.fn(({ children, onClick, disabled, variant }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  )),
}));

import { open } from '@tauri-apps/plugin-dialog';
import { libraryService } from '@/services/libraryService';

const mockOpen = vi.mocked(open);
const mockLibraryService = vi.mocked(libraryService);

describe('ImportDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onImportStart: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOpen.mockResolvedValue(null);
    mockLibraryService.import.mockResolvedValue({
      success: true,
      data: {
        id: 'skill-1',
        name: 'Test Skill',
        folderName: 'test-skill',
        version: '1.0.0',
        description: 'Test',
        path: '/path',
        skillMdPath: '/path/SKILL.md',
        importedAt: new Date(),
        size: 1024,
        fileCount: 1,
        hasResources: false,
        deployments: [],
      },
    });
  });

  describe('rendering', () => {
    it('should render dialog when open', () => {
      render(<ImportDialog {...defaultProps} />);
      expect(screen.getByText('Import Skills')).toBeInTheDocument();
    });

    it('should render import from folder button', () => {
      render(<ImportDialog {...defaultProps} />);
      expect(screen.getByText('From Folder')).toBeInTheDocument();
      expect(screen.getByText('Select skill folder(s)')).toBeInTheDocument();
    });

    it('should render import from zip button', () => {
      render(<ImportDialog {...defaultProps} />);
      expect(screen.getByText('From Zip')).toBeInTheDocument();
      expect(screen.getByText('Select .zip file(s)')).toBeInTheDocument();
    });

    it('should render drag-drop zone', () => {
      render(<ImportDialog {...defaultProps} />);
      expect(screen.getByText('Drag and drop skill folders or zip files')).toBeInTheDocument();
      expect(screen.getByText('Supports multiple selection')).toBeInTheDocument();
    });

    it('should render cancel and import buttons', () => {
      render(<ImportDialog {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Import 0 Skills')).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
      render(<ImportDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Import Skills')).not.toBeInTheDocument();
    });
  });

  describe('import from folder button', () => {
    it('should call open dialog with correct options when clicking folder button', async () => {
      render(<ImportDialog {...defaultProps} />);

      const folderButton = screen.getByText('From Folder').closest('button');
      if (folderButton) {
        fireEvent.click(folderButton);
      }

      await waitFor(() => {
        expect(mockOpen).toHaveBeenCalledWith({
          directory: true,
          multiple: true,
          title: 'Select skill folder(s)',
        });
      });
    });

    it('should add selected folders to items list', async () => {
      mockOpen.mockResolvedValueOnce(['/path/to/skill1', '/path/to/skill2']);

      render(<ImportDialog {...defaultProps} />);

      const folderButton = screen.getByText('From Folder').closest('button');
      if (folderButton) {
        fireEvent.click(folderButton);
      }

      await waitFor(() => {
        expect(screen.getByText('skill1')).toBeInTheDocument();
        expect(screen.getByText('skill2')).toBeInTheDocument();
      });
    });
  });

  describe('import from zip button', () => {
    it('should call open dialog with correct options when clicking zip button', async () => {
      render(<ImportDialog {...defaultProps} />);

      const zipButton = screen.getByText('From Zip').closest('button');
      if (zipButton) {
        fireEvent.click(zipButton);
      }

      await waitFor(() => {
        expect(mockOpen).toHaveBeenCalledWith({
          multiple: true,
          filters: [{ name: 'Zip Files', extensions: ['zip'] }],
          title: 'Select skill zip file(s)',
        });
      });
    });

    it('should add selected zip files to items list', async () => {
      mockOpen.mockResolvedValueOnce(['/path/to/skill.zip']);

      render(<ImportDialog {...defaultProps} />);

      const zipButton = screen.getByText('From Zip').closest('button');
      if (zipButton) {
        fireEvent.click(zipButton);
      }

      await waitFor(() => {
        expect(screen.getByText('skill')).toBeInTheDocument();
      });
    });
  });

  describe('drag-drop zone', () => {
    it('should handle drag over event', () => {
      render(<ImportDialog {...defaultProps} />);

      const dropZone = screen.getByText('Drag and drop skill folders or zip files').parentElement;
      if (dropZone) {
        const dragOverEvent = new Event('dragover', { bubbles: true });
        Object.defineProperty(dragOverEvent, 'preventDefault', { value: vi.fn() });
        fireEvent(dropZone, dragOverEvent);
      }
    });

    it('should handle drop event with files', () => {
      render(<ImportDialog {...defaultProps} />);

      const dropZone = screen.getByText('Drag and drop skill folders or zip files').parentElement;

      const mockFiles = {
        length: 2,
        0: { name: 'skill1', path: '/path/skill1' },
        1: { name: 'skill2.zip', path: '/path/skill2.zip' },
      };

      if (dropZone) {
        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: mockFiles,
          },
        });
      }
    });
  });

  describe('validation errors', () => {
    it('should show validation error for invalid folder name', async () => {
      mockOpen.mockResolvedValueOnce(['/path/to/invalid folder']);

      render(<ImportDialog {...defaultProps} />);

      const folderButton = screen.getByText('From Folder').closest('button');
      if (folderButton) {
        fireEvent.click(folderButton);
      }

      await waitFor(() => {
        expect(screen.getByText('invalid folder')).toBeInTheDocument();
      });

      const importButton = screen.getByText('Import 1 Skill');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid folder name/)).toBeInTheDocument();
      });
    });

    it('should show validation warning banner for invalid items', async () => {
      mockOpen.mockResolvedValueOnce(['/path/to/invalid folder']);

      render(<ImportDialog {...defaultProps} />);

      const folderButton = screen.getByText('From Folder').closest('button');
      if (folderButton) {
        fireEvent.click(folderButton);
      }

      await waitFor(() => {
        expect(screen.getByText('invalid folder')).toBeInTheDocument();
      });

      const importButton = screen.getByText('Import 1 Skill');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(
          screen.getByText('Some items have validation errors and will be skipped.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('item management', () => {
    it('should remove item when clicking remove button', async () => {
      mockOpen.mockResolvedValueOnce(['/path/to/skill']);

      render(<ImportDialog {...defaultProps} />);

      const folderButton = screen.getByText('From Folder').closest('button');
      if (folderButton) {
        fireEvent.click(folderButton);
      }

      await waitFor(() => {
        expect(screen.getByText('skill')).toBeInTheDocument();
      });

      const removeButton = screen.getByLabelText('Remove');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('skill')).not.toBeInTheDocument();
      });
    });

    it('should disable import button when no valid items', () => {
      render(<ImportDialog {...defaultProps} />);
      const importButton = screen.getByText('Import 0 Skills');
      expect(importButton).toBeDisabled();
    });
  });

  describe('import flow', () => {
    it('should call onImportStart with paths when importing', async () => {
      const onImportStart = vi.fn();
      mockOpen.mockResolvedValueOnce(['/path/to/skill']);

      render(<ImportDialog {...defaultProps} onImportStart={onImportStart} />);

      const folderButton = screen.getByText('From Folder').closest('button');
      if (folderButton) {
        fireEvent.click(folderButton);
      }

      await waitFor(() => {
        expect(screen.getByText('skill')).toBeInTheDocument();
      });

      const importButton = screen.getByText('Import 1 Skill');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(onImportStart).toHaveBeenCalledWith(['/path/to/skill']);
      });
    });

    it('should close dialog after successful import', async () => {
      const onClose = vi.fn();
      mockOpen.mockResolvedValueOnce(['/path/to/skill']);

      render(<ImportDialog {...defaultProps} onClose={onClose} />);

      const folderButton = screen.getByText('From Folder').closest('button');
      if (folderButton) {
        fireEvent.click(folderButton);
      }

      await waitFor(() => {
        expect(screen.getByText('skill')).toBeInTheDocument();
      });

      const importButton = screen.getByText('Import 1 Skill');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('close dialog', () => {
    it('should call onClose when clicking close button', () => {
      const onClose = vi.fn();
      render(<ImportDialog {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking cancel button', () => {
      const onClose = vi.fn();
      render(<ImportDialog {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should clear items when closing', async () => {
      mockOpen.mockResolvedValueOnce(['/path/to/skill']);

      const onClose = vi.fn();
      render(<ImportDialog {...defaultProps} onClose={onClose} />);

      const folderButton = screen.getByText('From Folder').closest('button');
      if (folderButton) {
        fireEvent.click(folderButton);
      }

      await waitFor(() => {
        expect(screen.getByText('skill')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });
  });
});