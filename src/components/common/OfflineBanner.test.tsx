import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OfflineBanner } from './OfflineBanner';

describe('OfflineBanner', () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when online', () => {
    render(<OfflineBanner isOffline={false} pendingChangesCount={0} onDismiss={mockOnDismiss} />);
    expect(screen.queryByText(/Changes saved locally/)).toBeNull();
  });

  it('renders banner when offline', () => {
    render(<OfflineBanner isOffline={true} pendingChangesCount={0} onDismiss={mockOnDismiss} />);
    expect(screen.getByText('Changes saved locally. Will sync when online.')).toBeInTheDocument();
  });

  it('shows pending changes count when greater than zero', () => {
    render(<OfflineBanner isOffline={true} pendingChangesCount={3} onDismiss={mockOnDismiss} />);
    expect(screen.getByText('3 changes saved locally. Will sync when online.')).toBeInTheDocument();
  });

  it('shows singular form for one change', () => {
    render(<OfflineBanner isOffline={true} pendingChangesCount={1} onDismiss={mockOnDismiss} />);
    expect(screen.getByText('1 change saved locally. Will sync when online.')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button clicked', () => {
    render(<OfflineBanner isOffline={true} pendingChangesCount={0} onDismiss={mockOnDismiss} />);
    fireEvent.click(screen.getByLabelText('Dismiss notification'));
    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('hides banner after dismiss', () => {
    const { rerender } = render(
      <OfflineBanner isOffline={true} pendingChangesCount={0} onDismiss={mockOnDismiss} />
    );
    fireEvent.click(screen.getByLabelText('Dismiss notification'));
    rerender(<OfflineBanner isOffline={true} pendingChangesCount={0} onDismiss={mockOnDismiss} />);
    expect(screen.queryByText(/Changes saved locally/)).toBeNull();
  });
});