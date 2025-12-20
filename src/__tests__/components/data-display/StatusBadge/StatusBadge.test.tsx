import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/render';
import { StatusBadge } from "@/components/data-display/StatusBadge";

describe('StatusBadge', () => {
  it('renders pending status', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders in_progress status', () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders completed status', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders cancelled status', () => {
    render(<StatusBadge status="cancelled" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('renders approved status', () => {
    render(<StatusBadge status="approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders rejected status', () => {
    render(<StatusBadge status="rejected" />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('renders active status', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders inactive status', () => {
    render(<StatusBadge status="inactive" />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<StatusBadge status="pending" className="custom-class" />);
    const badge = screen.getByText('Pending');
    expect(badge.className).toContain('custom-class');
  });

  it('defaults to pending for unknown status', () => {
    // @ts-expect-error - testing invalid status
    render(<StatusBadge status="unknown" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});

