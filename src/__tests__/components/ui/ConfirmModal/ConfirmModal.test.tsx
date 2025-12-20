import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import { ConfirmModal } from "@/components/ui/ConfirmModal";

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('displays title and message', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('shows default confirm and cancel buttons', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('shows custom button text', () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmText="Delete"
        cancelText="Keep"
      />
    );
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);
    
    const confirmButton = screen.getByText('Confirm');
    await userEvent.click(confirmButton);
    
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', async () => {
    const onClose = vi.fn();
    render(<ConfirmModal {...defaultProps} onClose={onClose} />);
    
    const cancelButton = screen.getByText('Cancel');
    await userEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<ConfirmModal {...defaultProps} isLoading={true} />);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    render(<ConfirmModal {...defaultProps} isLoading={true} />);
    const confirmButton = screen.getByText('Processing...');
    expect(confirmButton).toBeDisabled();
  });

  it('displays danger icon for danger type', () => {
    render(<ConfirmModal {...defaultProps} type="danger" />);
    const icon = document.querySelector('.text-red-600');
    expect(icon).toBeInTheDocument();
  });

  it('displays warning icon for warning type', () => {
    render(<ConfirmModal {...defaultProps} type="warning" />);
    const icon = document.querySelector('.text-yellow-600');
    expect(icon).toBeInTheDocument();
  });

  it('displays success icon for success type', () => {
    render(<ConfirmModal {...defaultProps} type="success" />);
    const icon = document.querySelector('.text-green-600');
    expect(icon).toBeInTheDocument();
  });

  it('displays info icon for info type', () => {
    render(<ConfirmModal {...defaultProps} type="info" />);
    const icon = document.querySelector('.text-blue-600');
    expect(icon).toBeInTheDocument();
  });

  it('defaults to warning type', () => {
    render(<ConfirmModal {...defaultProps} />);
    const icon = document.querySelector('.text-yellow-600');
    expect(icon).toBeInTheDocument();
  });
});

