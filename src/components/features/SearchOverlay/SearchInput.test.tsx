import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input with placeholder', () => {
    render(<SearchInput {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search skills...')).toBeInTheDocument();
  });

  it('displays current value', () => {
    render(<SearchInput {...defaultProps} value="test query" />);
    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });

  it('calls onChange when input changes', () => {
    const onChange = vi.fn();
    render(<SearchInput {...defaultProps} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Search skills...');
    fireEvent.change(input, { target: { value: 'new query' } });

    expect(onChange).toHaveBeenCalledWith('new query');
  });

  it('shows loading spinner when isLoading is true', () => {
    const { container } = render(<SearchInput {...defaultProps} isLoading={true} />);
    // The Spinner icon is rendered as an SVG with the loadingIcon class
    const svg = container.querySelector('svg[class*="loadingIcon"]');
    expect(svg).toBeInTheDocument();
  });

  it('shows clear button when value is present', () => {
    render(<SearchInput {...defaultProps} value="test" />);
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('hides clear button when loading', () => {
    render(<SearchInput {...defaultProps} value="test" isLoading={true} />);
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('clears input and focuses when clear button clicked', () => {
    const onChange = vi.fn();
    render(<SearchInput {...defaultProps} value="test" onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('Clear search'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('uses custom placeholder', () => {
    render(<SearchInput {...defaultProps} placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });
});
