import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import { ToastComponent } from "@/components/ui/Toast";

describe('ToastComponent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders toast message', () => {
    const toast = { id: '1', message: 'Test message', type: 'info' as const };
    const onClose = vi.fn();

    render(<ToastComponent toast={toast} onClose={onClose} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('displays success toast', () => {
    const toast = { id: '1', message: 'Success!', type: 'success' as const };
    const onClose = vi.fn();

    render(<ToastComponent toast={toast} onClose={onClose} />);
    expect(screen.getByText('Success!')).toBeInTheDocument();
    const toastElement = screen.getByText('Success!').closest('div');
    expect(toastElement?.className).toContain('bg-green-600');
  });

  it('displays error toast', () => {
    const toast = { id: '1', message: 'Error!', type: 'error' as const };
    const onClose = vi.fn();

    render(<ToastComponent toast={toast} onClose={onClose} />);
    expect(screen.getByText('Error!')).toBeInTheDocument();
    const toastElement = screen.getByText('Error!').closest('div');
    expect(toastElement?.className).toContain('bg-red-600');
  });

  it('displays warning toast', () => {
    const toast = { id: '1', message: 'Warning!', type: 'warning' as const };
    const onClose = vi.fn();

    render(<ToastComponent toast={toast} onClose={onClose} />);
    expect(screen.getByText('Warning!')).toBeInTheDocument();
    const toastElement = screen.getByText('Warning!').closest('div');
    expect(toastElement?.className).toContain('bg-yellow-600');
  });

  it('displays info toast', () => {
    const toast = { id: '1', message: 'Info!', type: 'info' as const };
    const onClose = vi.fn();

    render(<ToastComponent toast={toast} onClose={onClose} />);
    expect(screen.getByText('Info!')).toBeInTheDocument();
    const toastElement = screen.getByText('Info!').closest('div');
    expect(toastElement?.className).toContain('bg-blue-600');
  });

  it('calls onClose when close button is clicked', async () => {
    vi.useRealTimers(); // Use real timers for userEvent
    const toast = { id: '1', message: 'Test', type: 'info' as const };
    const onClose = vi.fn();

    render(<ToastComponent toast={toast} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Close');
    await userEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledWith('1');
    vi.useFakeTimers(); // Restore fake timers
  });

  it('auto-closes after default duration', async () => {
    const toast = { id: '1', message: 'Test', type: 'info' as const };
    const onClose = vi.fn();

    render(<ToastComponent toast={toast} onClose={onClose} />);

    // Wait for useEffect to set up timer (give it a moment)
    await waitFor(() => {
      expect(onClose).not.toHaveBeenCalled();
    }, { timeout: 100 });

    // Advance time past default duration (3000ms)
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith('1');
    }, { timeout: 1000 });
  });

  it('auto-closes after custom duration', async () => {
    const toast = { id: '1', message: 'Test', type: 'info' as const, duration: 5000 };
    const onClose = vi.fn();

    render(<ToastComponent toast={toast} onClose={onClose} />);

    // Wait for useEffect to set up timer
    await waitFor(() => {
      expect(onClose).not.toHaveBeenCalled();
    }, { timeout: 100 });

    // Advance time past custom duration (5000ms)
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith('1');
    }, { timeout: 1000 });
  });

  it('cleans up timer on unmount', () => {
    const toast = { id: '1', message: 'Test', type: 'info' as const };
    const onClose = vi.fn();

    const { unmount } = render(<ToastComponent toast={toast} onClose={onClose} />);
    
    unmount();
    vi.advanceTimersByTime(3000);

    expect(onClose).not.toHaveBeenCalled();
  });
});

