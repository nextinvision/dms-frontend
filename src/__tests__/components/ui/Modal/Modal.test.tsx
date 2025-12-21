import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import { Modal } from "@/components/ui/Modal";

describe('Modal', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        Content
      </Modal>
    );
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        Content
      </Modal>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('displays title when provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        Content
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} showCloseButton={true}>
        Content
      </Modal>
    );
    
    const closeButton = screen.getByRole('button');
    await userEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not show close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} showCloseButton={false}>
        Content
      </Modal>
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies small size', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} size="sm">
        Content
      </Modal>
    );
    const modal = screen.getByText('Content').closest('.max-w-md');
    expect(modal).toBeInTheDocument();
  });

  it('applies medium size by default', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        Content
      </Modal>
    );
    const modal = screen.getByText('Content').closest('.max-w-2xl');
    expect(modal).toBeInTheDocument();
  });

  it('applies large size', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} size="lg">
        Content
      </Modal>
    );
    const modal = screen.getByText('Content').closest('.max-w-4xl');
    expect(modal).toBeInTheDocument();
  });

  it('applies extra large size', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} size="xl">
        Content
      </Modal>
    );
    const modal = screen.getByText('Content').closest('.max-w-6xl');
    expect(modal).toBeInTheDocument();
  });

  it('prevents body scroll when open', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        Content
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={vi.fn()}>
        Content
      </Modal>
    );
    
    rerender(
      <Modal isOpen={false} onClose={vi.fn()}>
        Content
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('unset');
  });

  it('renders children content', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div data-testid="child">Child Content</div>
      </Modal>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });
});

