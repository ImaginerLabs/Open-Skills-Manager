import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CategoryFilter } from './CategoryFilter';

const mockCategories = [
  { id: 'cat-1', name: 'Development', skillCount: 10, groups: [], isCustom: false, createdAt: new Date() },
  { id: 'cat-2', name: 'Testing', skillCount: 5, groups: [], isCustom: false, createdAt: new Date() },
];

vi.mock('../../../services/libraryService', () => ({
  libraryService: {
    categories: {
      list: vi.fn(),
    },
  },
}));

describe('CategoryFilter', () => {
  const defaultProps = {
    value: null,
    onChange: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { libraryService } = await import('../../../services/libraryService');
    vi.mocked(libraryService.categories.list).mockResolvedValue({
      success: true,
      data: mockCategories,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays "All Categories" by default', () => {
    render(<CategoryFilter {...defaultProps} />);
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<CategoryFilter {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /All Categories/ }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('loads and displays categories', async () => {
    await act(async () => {
      render(<CategoryFilter {...defaultProps} />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /All Categories/ }));
    });

    await waitFor(
      () => {
        expect(screen.getByText('Development')).toBeInTheDocument();
        expect(screen.getByText('Testing')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('displays category count', async () => {
    await act(async () => {
      render(<CategoryFilter {...defaultProps} />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /All Categories/ }));
    });

    await waitFor(
      () => {
        expect(screen.getByText('(10)')).toBeInTheDocument();
        expect(screen.getByText('(5)')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('calls onChange when category selected', async () => {
    const onChange = vi.fn();

    await act(async () => {
      render(<CategoryFilter {...defaultProps} onChange={onChange} />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /All Categories/ }));
    });

    await waitFor(
      () => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    fireEvent.click(screen.getByRole('option', { name: /Development/ }));
    expect(onChange).toHaveBeenCalledWith('cat-1');
  });

  it('shows selected category name', () => {
    render(<CategoryFilter {...defaultProps} value="cat-1" />);
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('calls onChange with null when "All Categories" selected', () => {
    const onChange = vi.fn();
    render(<CategoryFilter {...defaultProps} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /All Categories/ }));
    fireEvent.click(screen.getByRole('option', { name: /^All Categories$/ }));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
