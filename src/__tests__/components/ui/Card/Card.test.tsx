import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/render';
import { Card } from "@/components/ui/Card";

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies default padding', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.querySelector('.bg-white');
    expect(card?.className).toContain('p-6');
  });

  it('applies no padding when specified', () => {
    const { container } = render(<Card padding="none">Content</Card>);
    const card = container.querySelector('.bg-white');
    expect(card?.className).not.toMatch(/p-[0-9]/);
  });

  it('applies small padding', () => {
    const { container } = render(<Card padding="sm">Content</Card>);
    const card = container.querySelector('.bg-white');
    expect(card?.className).toContain('p-4');
  });

  it('applies large padding', () => {
    const { container } = render(<Card padding="lg">Content</Card>);
    const card = container.querySelector('.bg-white');
    expect(card?.className).toContain('p-8');
  });

  it('applies default shadow', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.querySelector('.bg-white');
    expect(card?.className).toContain('shadow-md');
  });

  it('applies no shadow when specified', () => {
    const { container } = render(<Card shadow="none">Content</Card>);
    const card = container.querySelector('.bg-white');
    expect(card?.className).not.toMatch(/shadow-/);
  });

  it('applies small shadow', () => {
    const { container } = render(<Card shadow="sm">Content</Card>);
    const card = container.querySelector('.bg-white');
    expect(card?.className).toContain('shadow-sm');
  });

  it('applies large shadow', () => {
    const { container } = render(<Card shadow="lg">Content</Card>);
    const card = container.querySelector('.bg-white');
    expect(card?.className).toContain('shadow-lg');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const card = container.querySelector('.bg-white');
    expect(card?.className).toContain('custom-class');
  });
});

