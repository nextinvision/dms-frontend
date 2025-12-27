import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import { EmptyState } from "@/components/ui/EmptyState";
import { FileText } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="No items" description="Try adding a new item" />);
    expect(screen.getByText('Try adding a new item')).toBeInTheDocument();
  });

  it('displays icon when provided', () => {
    render(<EmptyState title="No items" icon={FileText} />);
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        title="No items"
        action={{ label: 'Add Item', onClick: handleClick }}
      />
    );
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('calls action onClick when button is clicked', async () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        title="No items"
        action={{ label: 'Add Item', onClick: handleClick }}
      />
    );
    
    const button = screen.getByText('Add Item');
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders children when provided', () => {
    render(
      <EmptyState title="No items">
        <div data-testid="custom-content">Custom content</div>
      </EmptyState>
    );
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
  });

  it('does not render icon when not provided', () => {
    render(<EmptyState title="No items" />);
    const iconContainer = document.querySelector('.bg-gray-100');
    expect(iconContainer).not.toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState title="No items" />);
    expect(screen.queryByText(/try|add|new/i)).not.toBeInTheDocument();
  });
});

