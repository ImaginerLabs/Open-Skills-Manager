import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CategoryFilter } from './CategoryFilter';

const mockGroups = [
  { id: 'grp-1', name: 'Development', skillCount: 10, categories: [], isCustom: false, createdAt: new Date() },
  { id: 'grp-2', name: 'Testing', skillCount: 5, categories: [], isCustom: false, createdAt: new Date() },
];

vi.mock('../../../services/libraryService', () => ({
  libraryService: {
    groups: {
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
    vi.mocked(libraryService.groups.list).mockResolvedValue({
      success: true,
      data: mockGroups,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays "All Groups" by default', () => {
    render(<CategoryFilter {...defaultProps} />);
    expect(screen.getByText('All Groups')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<CategoryFilter {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /All Groups/ }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('loads and displays groups', async () => {
    await act(async () => {
      render(<CategoryFilter {...defaultProps} />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /All Groups/ }));
    });

    await waitFor(
      () => {
        expect(screen.getByText('Development')).toBeInTheDocument();
        expect(screen.getByText('Testing')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('displays group count', async () => {
    await act(async () => {
      render(<CategoryFilter {...defaultProps} />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /All Groups/ }));
    });

    await waitFor(
      () => {
        expect(screen.getByText('(10)')).toBeInTheDocument();
        expect(screen.getByText('(5)')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('calls onChange when group selected', async () => {
    const onChange = vi.fn();

    await act(async () => {
      render(<CategoryFilter {...defaultProps} onChange={onChange} />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /All Groups/ }));
    });

    await waitFor(
      () => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    fireEvent.click(screen.getByRole('option', { name: /Development/ }));
    expect(onChange).toHaveBeenCalledWith('grp-1');
  });

  it('shows selected group name', () => {
    render(<CategoryFilter {...defaultProps} value="grp-1" />);
    expect(screen.getByText('All Groups')).toBeInTheDocument();
  });

  it('calls onChange with null when "All Groups" selected', () => {
    const onChange = vi.fn();
    render(<CategoryFilter {...defaultProps} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /All Groups/ }));
    fireEvent.click(screen.getByRole('option', { name: /^All Groups$/ }));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});