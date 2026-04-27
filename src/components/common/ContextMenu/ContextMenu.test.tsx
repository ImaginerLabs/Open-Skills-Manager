import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Trash, PencilSimple } from '@phosphor-icons/react';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';

describe('ContextMenu', () => {
  const mockItems: ContextMenuItem[] = [
    {
      id: 'edit',
      label: 'Edit',
      icon: PencilSimple,
      onClick: vi.fn(),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash,
      onClick: vi.fn(),
      variant: 'danger',
    },
  ];

  const mockPosition = { x: 100, y: 200 };
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders menu items correctly', () => {
      render(
        <ContextMenu
          isOpen={true}
          position={mockPosition}
          items={mockItems}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <ContextMenu
          isOpen={false}
          position={mockPosition}
          items={mockItems}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('positions menu at given coordinates', () => {
      render(
        <ContextMenu
          isOpen={true}
          position={mockPosition}
          items={mockItems}
          onClose={mockOnClose}
        />
      );

      const menu = screen.getByRole('menu');
      expect(menu).toHaveStyle({ left: '100px', top: '200px' });
    });

    it('renders danger variant for items with variant="danger"', () => {
      render(
        <ContextMenu
          isOpen={true}
          position={mockPosition}
          items={mockItems}
          onClose={mockOnClose}
        />
      );

      const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
      // CSS Modules generate hashed class names, check for presence of danger style
      expect(deleteButton.className).toMatch(/danger/);
    });
  });

  describe('interactions', () => {
    it('calls onClick handler when menu item is clicked', () => {
      const onClick = vi.fn();
      const items: ContextMenuItem[] = [
        { id: 'test', label: 'Test', icon: PencilSimple, onClick },
      ];

      render(
        <ContextMenu
          isOpen={true}
          position={mockPosition}
          items={items}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByRole('menuitem', { name: /test/i }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClose after menu item click', () => {
      const onClick = vi.fn();
      const items: ContextMenuItem[] = [
        { id: 'test', label: 'Test', icon: PencilSimple, onClick },
      ];

      render(
        <ContextMenu
          isOpen={true}
          position={mockPosition}
          items={items}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByRole('menuitem', { name: /test/i }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking outside the menu', () => {
      render(
        <ContextMenu
          isOpen={true}
          position={mockPosition}
          items={mockItems}
          onClose={mockOnClose}
        />
      );

      // Click on the overlay
      fireEvent.mouseDown(screen.getByRole('presentation'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when pressing Escape key', () => {
      render(
        <ContextMenu
          isOpen={true}
          position={mockPosition}
          items={mockItems}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when pressing other keys', () => {
      render(
        <ContextMenu
          isOpen={true}
          position={mockPosition}
          items={mockItems}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Enter' });
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(
        <ContextMenu
          isOpen={true}
          position={mockPosition}
          items={mockItems}
          onClose={mockOnClose}
        />
      );

      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
      expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('handles empty items array', () => {
      render(
        <ContextMenu
          isOpen={true}
          position={mockPosition}
          items={[]}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    });

    it('handles items without onClick handler', () => {
      const items: ContextMenuItem[] = [
        { id: 'test', label: 'Test', icon: PencilSimple },
      ];

      render(
        <ContextMenu
          isOpen={true}
          position={mockPosition}
          items={items}
          onClose={mockOnClose}
        />
      );

      // Should not throw
      fireEvent.click(screen.getByRole('menuitem', { name: /test/i }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
