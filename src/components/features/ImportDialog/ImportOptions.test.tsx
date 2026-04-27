import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportOptions } from './ImportOptions';

vi.mock('./ImportOptions.module.scss', () => ({
  default: {
    options: 'options',
    optionButton: 'optionButton',
    optionIcon: 'optionIcon',
    optionLabel: 'optionLabel',
    optionDescription: 'optionDescription',
  },
}));

describe('ImportOptions', () => {
  const defaultProps = {
    onSelectFolder: vi.fn(),
    onSelectZip: vi.fn(),
  };

  describe('rendering', () => {
    it('should render From Folder button with label and description', () => {
      render(<ImportOptions {...defaultProps} />);
      expect(screen.getByText('From Folder')).toBeInTheDocument();
      expect(screen.getByText('Select skill folder(s)')).toBeInTheDocument();
    });

    it('should render From Zip button with label and description', () => {
      render(<ImportOptions {...defaultProps} />);
      expect(screen.getByText('From Zip')).toBeInTheDocument();
      expect(screen.getByText('Select .zip file(s)')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onSelectFolder when clicking From Folder button', () => {
      const onSelectFolder = vi.fn();
      render(<ImportOptions {...defaultProps} onSelectFolder={onSelectFolder} />);

      const folderButton = screen.getByText('From Folder').closest('button');
      if (folderButton) {
        fireEvent.click(folderButton);
      }

      expect(onSelectFolder).toHaveBeenCalledTimes(1);
    });

    it('should call onSelectZip when clicking From Zip button', () => {
      const onSelectZip = vi.fn();
      render(<ImportOptions {...defaultProps} onSelectZip={onSelectZip} />);

      const zipButton = screen.getByText('From Zip').closest('button');
      if (zipButton) {
        fireEvent.click(zipButton);
      }

      expect(onSelectZip).toHaveBeenCalledTimes(1);
    });
  });
});
