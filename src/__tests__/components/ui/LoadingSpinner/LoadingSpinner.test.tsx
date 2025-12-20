import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/render';
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

describe('LoadingSpinner', () => {
  it('renders spinner', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('has accessible label', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('applies small size', () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByRole('status');
    expect(spinner.className).toContain('w-4 h-4');
  });

  it('applies medium size by default', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner.className).toContain('w-8 h-8');
  });

  it('applies large size', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByRole('status');
    expect(spinner.className).toContain('w-12 h-12');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    const spinner = screen.getByRole('status');
    expect(spinner.className).toContain('custom-class');
  });

  it('has animation class', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner.className).toContain('animate-spin');
  });
});

