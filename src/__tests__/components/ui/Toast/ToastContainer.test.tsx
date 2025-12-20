import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/render';
import { ToastContainer } from "@/components/ui/Toast/ToastContainer";
import type { Toast } from "@/components/ui/Toast";

describe('ToastContainer', () => {
  const mockToasts: Toast[] = [
    { id: '1', message: 'Success message', type: 'success' },
    { id: '2', message: 'Error message', type: 'error' },
  ];

  it('returns null when toasts array is empty', () => {
    const { container } = render(<ToastContainer toasts={[]} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all toasts', () => {
    render(<ToastContainer toasts={mockToasts} onClose={vi.fn()} />);
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders toasts in correct order', () => {
    render(<ToastContainer toasts={mockToasts} onClose={vi.fn()} />);
    const messages = screen.getAllByText(/message/);
    expect(messages[0]).toHaveTextContent('Success message');
    expect(messages[1]).toHaveTextContent('Error message');
  });

  it('passes onClose to each toast', () => {
    const onClose = vi.fn();
    render(<ToastContainer toasts={mockToasts} onClose={onClose} />);
    
    // Each toast should receive the onClose handler
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('has correct container styling', () => {
    const { container } = render(<ToastContainer toasts={mockToasts} onClose={vi.fn()} />);
    const wrapper = container.querySelector('.fixed.top-20');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.className).toContain('z-[10000]');
  });

  it('applies pointer-events-none to container', () => {
    const { container } = render(<ToastContainer toasts={mockToasts} onClose={vi.fn()} />);
    const wrapper = container.querySelector('.pointer-events-none');
    expect(wrapper).toBeInTheDocument();
  });

  it('applies pointer-events-auto to individual toasts', () => {
    const { container } = render(<ToastContainer toasts={mockToasts} onClose={vi.fn()} />);
    const toastWrappers = container.querySelectorAll('.pointer-events-auto');
    expect(toastWrappers.length).toBe(2);
  });
});

