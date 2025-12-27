import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/render';
import { FormField } from "@/components/forms/FormField";
import { Input } from '@/components/ui/Input';

describe('FormField', () => {
  it('renders label', () => {
    render(
      <FormField label="Email">
        <Input />
      </FormField>
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <FormField label="Email">
        <Input placeholder="Enter email" />
      </FormField>
    );
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('displays required indicator', () => {
    render(
      <FormField label="Email" required>
        <Input />
      </FormField>
    );
    const label = screen.getByText('Email');
    expect(label.querySelector('.text-red-500')).toBeInTheDocument();
  });

  it('does not display required indicator when not required', () => {
    render(
      <FormField label="Email">
        <Input />
      </FormField>
    );
    const label = screen.getByText('Email');
    const requiredIndicator = label.querySelector('.text-red-500');
    expect(requiredIndicator).not.toBeInTheDocument();
  });

  it('displays error message', () => {
    render(
      <FormField label="Email" error="Email is required">
        <Input />
      </FormField>
    );
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('displays helper text', () => {
    render(
      <FormField label="Email" helperText="Enter your email address">
        <Input />
      </FormField>
    );
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  it('does not show helper text when error is present', () => {
    render(
      <FormField
        label="Email"
        error="Email is required"
        helperText="Enter your email address"
      >
        <Input />
      </FormField>
    );
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.queryByText('Enter your email address')).not.toBeInTheDocument();
  });

  it('shows helper text when no error', () => {
    render(
      <FormField label="Email" helperText="Enter your email address">
        <Input />
      </FormField>
    );
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  it('applies correct label styling', () => {
    render(
      <FormField label="Email">
        <Input />
      </FormField>
    );
    const label = screen.getByText('Email');
    expect(label.className).toContain('text-sm');
    expect(label.className).toContain('font-medium');
  });
});

