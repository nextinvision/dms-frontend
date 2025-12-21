import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/render';
import { PriorityIndicator } from "@/components/data-display/PriorityIndicator";

describe('PriorityIndicator', () => {
  it('renders low priority', () => {
    render(<PriorityIndicator priority="low" />);
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders medium priority', () => {
    render(<PriorityIndicator priority="medium" />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('renders high priority', () => {
    render(<PriorityIndicator priority="high" />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders urgent priority', () => {
    render(<PriorityIndicator priority="urgent" />);
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('shows icon by default', () => {
    render(<PriorityIndicator priority="high" />);
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('hides icon when showIcon is false', () => {
    render(<PriorityIndicator priority="high" showIcon={false} />);
    const icon = document.querySelector('svg');
    expect(icon).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<PriorityIndicator priority="high" className="custom-class" />);
    const badge = screen.getByText('High').closest('span');
    expect(badge?.className).toContain('custom-class');
  });
});

