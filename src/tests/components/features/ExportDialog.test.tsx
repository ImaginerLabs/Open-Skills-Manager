import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportDialog } from '@/components/features/ExportDialog/ExportDialog';
import type { LibrarySkill } from '@/stores/libraryStore';

// Mock CSS modules
vi.mock('@/components/features/ExportDialog/ExportDialog.module.scss', () => ({
  default: {
    content: 'content',
    description: 'description',
    options: 'options',
    option: 'option',
    optionSelected: 'optionSelected',
    optionIcon: 'optionIcon',
    optionContent: 'optionContent',
    optionLabel: 'optionLabel',
    optionDescription: 'optionDescription',
    optionCheck: 'optionCheck',
    batchInfo: 'batchInfo',
  },
}));

vi.mock('@/components/ui/Modal/Modal', () => ({
  Modal: vi.fn(({ children, open, onClose, title }) =>
    open ? (
      <div data-testid="modal">
        {title && <h2>{title}</h2>}
        <button onClick={onClose} data-testid="modal-close">Close</button>
        {children}
      </div>
    ) : null
  ),
  ModalFooter: vi.fn(({ children }) => <div data-testid="modal-footer">{children}</div>),
}));

vi.mock('@/components/ui/Button/Button', () => ({
  Button: vi.fn(({ children, onClick, disabled, variant }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  )),
}));

const mockSkill: LibrarySkill = {
  id: 'skill-1',
  name: 'Test Skill',
  folderName: 'test-skill',
  version: '1.0.0',
  description: 'A test skill',
  path: '/path/to/skill',
  skillMdPath: '/path/to/skill/SKILL.md',
  importedAt: new Date(),
  size: 1024,
  fileCount: 5,
  hasResources: false,
  deployments: [],
};

const mockSkills: LibrarySkill[] = [
  mockSkill,
  {
    id: 'skill-2',
    name: 'Second Skill',
    folderName: 'second-skill',
    version: '2.0.0',
    description: 'Another skill',
    path: '/path/to/skill2',
    skillMdPath: '/path/to/skill2/SKILL.md',
    importedAt: new Date(),
    size: 2048,
    fileCount: 10,
    hasResources: true,
    deployments: [],
  },
  {
    id: 'skill-3',
    name: 'Third Skill',
    folderName: 'third-skill',
    version: '1.5.0',
    description: 'Yet another skill',
    path: '/path/to/skill3',
    skillMdPath: '/path/to/skill3/SKILL.md',
    importedAt: new Date(),
    size: 512,
    fileCount: 3,
    hasResources: false,
    deployments: [],
  },
];

describe('ExportDialog', () => {
  const defaultProps = {
    isOpen: true,
    skills: [mockSkill],
    onClose: vi.fn(),
    onExportStart: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render dialog when open', () => {
      render(<ExportDialog {...defaultProps} />);
      expect(screen.getByText('Export Skills')).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
      render(<ExportDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Export Skills')).not.toBeInTheDocument();
    });

    it('should render export as zip option', () => {
      render(<ExportDialog {...defaultProps} />);
      expect(screen.getByText('Export as Zip')).toBeInTheDocument();
      expect(screen.getByText('Create a compressed archive for easy sharing')).toBeInTheDocument();
    });

    it('should render export as folder option', () => {
      render(<ExportDialog {...defaultProps} />);
      expect(screen.getByText('Export as Folder')).toBeInTheDocument();
      expect(screen.getByText('Copy the skill folder with all contents')).toBeInTheDocument();
    });

    it('should render cancel and export buttons', () => {
      render(<ExportDialog {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Export Skill')).toBeInTheDocument();
    });
  });

  describe('single skill export', () => {
    it('should show skill name in description for single skill', () => {
      render(<ExportDialog {...defaultProps} />);
      expect(screen.getByText('Export "Test Skill"')).toBeInTheDocument();
    });

    it('should call onExportStart with zip format', () => {
      const onExportStart = vi.fn();
      render(<ExportDialog {...defaultProps} onExportStart={onExportStart} />);

      const exportButton = screen.getByText('Export Skill');
      fireEvent.click(exportButton);

      expect(onExportStart).toHaveBeenCalledWith('zip', [mockSkill]);
    });

    it('should call onExportStart with folder format', () => {
      const onExportStart = vi.fn();
      render(<ExportDialog {...defaultProps} onExportStart={onExportStart} />);

      const folderOption = screen.getByText('Export as Folder').closest('button');
      if (folderOption) {
        fireEvent.click(folderOption);
      }

      const exportButton = screen.getByText('Export Skill');
      fireEvent.click(exportButton);

      expect(onExportStart).toHaveBeenCalledWith('folder', [mockSkill]);
    });
  });

  describe('multi-select export', () => {
    it('should show count in description for multiple skills', () => {
      render(<ExportDialog {...defaultProps} skills={mockSkills} />);
      expect(screen.getByText('Export 3 selected skills')).toBeInTheDocument();
    });

    it('should show batch info for multiple skills', () => {
      render(<ExportDialog {...defaultProps} skills={mockSkills} />);
      expect(screen.getByText('3 skills will be exported as separate zip files')).toBeInTheDocument();
    });

    it('should update batch info when format changes', () => {
      render(<ExportDialog {...defaultProps} skills={mockSkills} />);

      const folderOption = screen.getByText('Export as Folder').closest('button');
      if (folderOption) {
        fireEvent.click(folderOption);
      }

      expect(screen.getByText('3 skills will be exported as separate folders')).toBeInTheDocument();
    });

    it('should show count in export button for multiple skills', () => {
      render(<ExportDialog {...defaultProps} skills={mockSkills} />);
      expect(screen.getByText('Export 3 Skills')).toBeInTheDocument();
    });

    it('should call onExportStart with all skills', () => {
      const onExportStart = vi.fn();
      render(<ExportDialog {...defaultProps} skills={mockSkills} onExportStart={onExportStart} />);

      const exportButton = screen.getByText('Export 3 Skills');
      fireEvent.click(exportButton);

      expect(onExportStart).toHaveBeenCalledWith('zip', mockSkills);
    });
  });

  describe('format selection', () => {
    it('should select zip format by default', () => {
      render(<ExportDialog {...defaultProps} />);
      const zipOption = screen.getByText('Export as Zip').closest('button');
      expect(zipOption?.getAttribute('aria-pressed')).toBe('true');
    });

    it('should change format when clicking folder option', () => {
      render(<ExportDialog {...defaultProps} />);

      const zipOption = screen.getByText('Export as Zip').closest('button');
      expect(zipOption?.getAttribute('aria-pressed')).toBe('true');

      const folderOption = screen.getByText('Export as Folder').closest('button');
      if (folderOption) {
        fireEvent.click(folderOption);
      }

      expect(folderOption?.getAttribute('aria-pressed')).toBe('true');
    });

    it('should toggle aria-pressed attribute on selection', () => {
      render(<ExportDialog {...defaultProps} />);

      const folderOption = screen.getByText('Export as Folder').closest('button');
      if (folderOption) {
        fireEvent.click(folderOption);
      }

      const zipOption = screen.getByText('Export as Zip').closest('button');
      if (zipOption) {
        fireEvent.click(zipOption);
      }

      expect(zipOption?.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('exporting state', () => {
    it('should show exporting state after clicking export', () => {
      render(<ExportDialog {...defaultProps} />);

      const exportButton = screen.getByText('Export Skill');
      fireEvent.click(exportButton);

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('should disable buttons while exporting', () => {
      render(<ExportDialog {...defaultProps} />);

      const exportButton = screen.getByText('Export Skill');
      fireEvent.click(exportButton);

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
      expect(screen.getByText('Exporting...')).toBeDisabled();
    });

    it('should disable format options while exporting', () => {
      render(<ExportDialog {...defaultProps} />);

      const exportButton = screen.getByText('Export Skill');
      fireEvent.click(exportButton);

      const zipOption = screen.getByText('Export as Zip').closest('button');
      const folderOption = screen.getByText('Export as Folder').closest('button');

      expect(zipOption).toBeDisabled();
      expect(folderOption).toBeDisabled();
    });
  });

  describe('close dialog', () => {
    it('should call onClose when clicking cancel button', () => {
      const onClose = vi.fn();
      render(<ExportDialog {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close dialog while exporting', () => {
      const onClose = vi.fn();
      render(<ExportDialog {...defaultProps} onClose={onClose} />);

      const exportButton = screen.getByText('Export Skill');
      fireEvent.click(exportButton);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty skills array', () => {
      render(<ExportDialog {...defaultProps} skills={[]} />);
      expect(screen.getByText('Export "skill"')).toBeInTheDocument(); // Uses fallback
    });

    it('should handle skills with undefined name', () => {
      const skillWithoutName = { ...mockSkill, name: undefined as unknown as string };
      render(<ExportDialog {...defaultProps} skills={[skillWithoutName]} />);
      expect(screen.getByText('Export "skill"')).toBeInTheDocument();
    });
  });
});