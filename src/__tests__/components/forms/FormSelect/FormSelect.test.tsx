import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import { FormSelect } from "@/components/forms/FormSelect";

describe('FormSelect', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  it('renders select element', () => {
    render(<FormSelect options={options} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays label when provided', () => {
    render(<FormSelect label="Select Option" options={options} />);
    expect(screen.getByText('Select Option')).toBeInTheDocument();
  });

  it('displays all options', () => {
    render(<FormSelect options={options} />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    render(<FormSelect options={options} />);
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'option2');
    expect(select).toHaveValue('option2');
  });

  it('calls onChange handler', async () => {
    const handleChange = vi.fn();
    render(<FormSelect options={options} onChange={handleChange} />);
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'option2');
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(<FormSelect options={options} error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('applies error styling when error is present', () => {
    render(<FormSelect options={options} error="Error" />);
    const select = screen.getByRole('combobox');
    expect(select.className).toContain('border-red-300');
  });

  it('displays helper text', () => {
    render(<FormSelect options={options} helperText="Please select an option" />);
    expect(screen.getByText('Please select an option')).toBeInTheDocument();
  });

  it('does not show helper text when error is present', () => {
    render(
      <FormSelect
        options={options}
        error="Error"
        helperText="Helper text"
      />
    );
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(<FormSelect label="Select" options={options} required />);
    const label = screen.getByText('Select');
    expect(label.querySelector('.text-red-500')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<FormSelect options={options} disabled />);
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<FormSelect options={options} className="custom-class" />);
    const select = screen.getByRole('combobox');
    expect(select.className).toContain('custom-class');
  });

  it('passes through other props', () => {
    render(<FormSelect options={options} data-testid="test-select" aria-label="Test" />);
    const select = screen.getByTestId('test-select');
    expect(select).toHaveAttribute('aria-label', 'Test');
  });
});

