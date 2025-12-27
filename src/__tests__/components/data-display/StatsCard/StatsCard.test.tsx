import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/render';
import { StatsCard } from "@/components/data-display/StatsCard";
import { FileText } from 'lucide-react';

describe('StatsCard', () => {
  it('renders title and value', () => {
    render(<StatsCard title="Total Jobs" value={100} />);
    expect(screen.getByText('Total Jobs')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('displays numeric value', () => {
    render(<StatsCard title="Count" value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('displays string value', () => {
    render(<StatsCard title="Status" value="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('displays icon when provided', () => {
    const { container } = render(<StatsCard title="Jobs" value={10} icon={FileText} />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('displays change value', () => {
    render(<StatsCard title="Jobs" value={100} change="+10%" />);
    expect(screen.getByText('+10%')).toBeInTheDocument();
  });

  it('applies up trend color', () => {
    render(<StatsCard title="Jobs" value={100} change="+10%" trend="up" />);
    const changeElement = screen.getByText('+10%');
    expect(changeElement.className).toContain('text-green-600');
  });

  it('applies down trend color', () => {
    render(<StatsCard title="Jobs" value={100} change="-5%" trend="down" />);
    const changeElement = screen.getByText('-5%');
    expect(changeElement.className).toContain('text-red-600');
  });

  it('applies neutral trend color by default', () => {
    render(<StatsCard title="Jobs" value={100} change="0%" />);
    const changeElement = screen.getByText('0%');
    expect(changeElement.className).toContain('text-gray-600');
  });

  it('applies custom className', () => {
    render(<StatsCard title="Jobs" value={100} className="custom-class" />);
    const card = screen.getByText('Jobs').closest('.bg-white');
    expect(card?.className).toContain('custom-class');
  });

  it('renders without icon', () => {
    render(<StatsCard title="Jobs" value={100} />);
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders without change value', () => {
    render(<StatsCard title="Jobs" value={100} />);
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.queryByText(/\+|\-/)).not.toBeInTheDocument();
  });
});

