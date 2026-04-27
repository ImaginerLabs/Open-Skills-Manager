import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DropZone } from './DropZone';

describe('DropZone', () => {
  const mockOnDragOver = vi.fn();
  const mockOnDragLeave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders drop zone with icon and text', () => {
    render(
      <DropZone
        isDragOver={false}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
      />
    );

    expect(screen.getByText('Drag and drop skill folders or zip files')).toBeInTheDocument();
    expect(screen.getByText('Supports multiple selection')).toBeInTheDocument();
  });

  it('applies active class when isDragOver is true', () => {
    const { container } = render(
      <DropZone
        isDragOver={true}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
      />
    );

    const dropZone = container.querySelector('[class*="dropZone"][class*="active"]');
    expect(dropZone).toBeInTheDocument();
  });

  it('does not apply active class when isDragOver is false', () => {
    const { container } = render(
      <DropZone
        isDragOver={false}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
      />
    );

    const dropZone = container.querySelector('[class*="dropZone"]');
    expect(dropZone).not.toHaveClass('active');
  });

  it('calls onDragOver when drag over event fires', () => {
    render(
      <DropZone
        isDragOver={false}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
      />
    );

    const dropZone = screen.getByText('Drag and drop skill folders or zip files').parentElement!;
    fireEvent.dragOver(dropZone);

    expect(mockOnDragOver).toHaveBeenCalled();
  });

  it('calls onDragLeave when drag leave event fires', () => {
    render(
      <DropZone
        isDragOver={false}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
      />
    );

    const dropZone = screen.getByText('Drag and drop skill folders or zip files').parentElement!;
    fireEvent.dragLeave(dropZone);

    expect(mockOnDragLeave).toHaveBeenCalled();
  });

  it('forwards ref to the drop zone element', () => {
    const ref = { current: null as HTMLDivElement | null };

    render(
      <DropZone
        ref={ref}
        isDragOver={false}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
      />
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
