import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import { FormDatePicker } from "@/components/forms/FormDatePicker";

describe('FormDatePicker', () => {
  it('renders date input', () => {
    const { container } = render(<FormDatePicker />);
    const input = container.querySelector('input[type="date"]');
    expect(input).toBeInTheDocument();
  });

  it('displays label when provided', () => {
    render(<FormDatePicker label="Date of Birth" />);
    expect(screen.getByText('Date of Birth')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<FormDatePicker error="Date is required" />);
    expect(screen.getByText('Date is required')).toBeInTheDocument();
  });

  it('displays helper text', () => {
    render(<FormDatePicker helperText="Select a date" />);
    expect(screen.getByText('Select a date')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    render(<FormDatePicker />);
    const input = document.querySelector('input[type="date"]') as HTMLInputElement;
    await userEvent.type(input, '2024-01-01');
    expect(input.value).toBe('2024-01-01');
  });

  it('calls onChange handler', async () => {
    const handleChange = vi.fn();
    render(<FormDatePicker onChange={handleChange} />);
    const input = document.querySelector('input[type="date"]') as HTMLInputElement;
    await userEvent.type(input, '2024-01-01');
    expect(handleChange).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(<FormDatePicker className="custom-datepicker" />);
    const input = container.querySelector('input');
    expect(input?.className).toContain('custom-datepicker');
  });

  it('passes through other input props', () => {
    render(<FormDatePicker disabled required min="2020-01-01" max="2030-12-31" />);
    const input = document.querySelector('input[type="date"]') as HTMLInputElement;
    expect(input).toBeDisabled();
    expect(input).toBeRequired();
    expect(input.min).toBe('2020-01-01');
    expect(input.max).toBe('2030-12-31');
  });
});

