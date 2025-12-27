import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import { Input } from "@/components/ui/Input";

describe('Input', () => {
  it('renders input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays placeholder text', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'test value');
    expect(input).toHaveValue('test value');
  });

  it('calls onChange handler', async () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'test');
    expect(handleChange).toHaveBeenCalled();
  });

  it('can be disabled', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('can be readonly', () => {
    render(<Input readOnly />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
  });

  it('accepts different input types', () => {
    const { rerender } = render(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" />);
    // Password inputs don't have textbox role, use getByDisplayValue or querySelector
    const passwordInput = document.querySelector('input[type="password"]');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('custom-class');
  });

  it('passes through other props', () => {
    render(<Input data-testid="test-input" aria-label="Test" />);
    const input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('aria-label', 'Test');
  });

  it('handles controlled input', () => {
    const { rerender } = render(<Input value="initial" onChange={vi.fn()} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('initial');

    rerender(<Input value="updated" onChange={vi.fn()} />);
    expect(input).toHaveValue('updated');
  });
});

