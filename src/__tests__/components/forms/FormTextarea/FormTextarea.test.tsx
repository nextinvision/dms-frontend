import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import { FormTextarea } from "@/components/forms/FormTextarea";

describe('FormTextarea', () => {
  it('renders textarea element', () => {
    render(<FormTextarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays label when provided', () => {
    render(<FormTextarea label="Description" />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('displays placeholder text', () => {
    render(<FormTextarea placeholder="Enter description" />);
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    render(<FormTextarea />);
    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, 'Test description');
    expect(textarea).toHaveValue('Test description');
  });

  it('calls onChange handler', async () => {
    const handleChange = vi.fn();
    render(<FormTextarea onChange={handleChange} />);
    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, 'Test');
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(<FormTextarea error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('applies error styling when error is present', () => {
    render(<FormTextarea error="Error" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.className).toContain('focus:ring-red-500');
  });

  it('displays helper text', () => {
    render(<FormTextarea helperText="Enter a detailed description" />);
    expect(screen.getByText('Enter a detailed description')).toBeInTheDocument();
  });

  it('does not show helper text when error is present', () => {
    render(
      <FormTextarea
        error="Error"
        helperText="Helper text"
      />
    );
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(<FormTextarea label="Description" required />);
    const label = screen.getByText('Description');
    expect(label.querySelector('.text-red-500')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<FormTextarea disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('can be readonly', () => {
    render(<FormTextarea readOnly />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('readonly');
  });

  it('respects rows attribute', () => {
    render(<FormTextarea rows={5} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('applies custom className', () => {
    render(<FormTextarea className="custom-class" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.className).toContain('custom-class');
  });

  it('passes through other props', () => {
    render(<FormTextarea data-testid="test-textarea" aria-label="Test" />);
    const textarea = screen.getByTestId('test-textarea');
    expect(textarea).toHaveAttribute('aria-label', 'Test');
  });
});

