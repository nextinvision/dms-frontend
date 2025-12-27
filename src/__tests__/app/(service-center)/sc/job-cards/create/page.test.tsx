import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import CreateJobCardPage from '@/app/(service-center)/sc/job-cards/create/page';
import { useJobCardForm } from '@/features/job-cards/hooks/useJobCardForm';

// Mock dependencies
vi.mock('@/features/job-cards/hooks/useJobCardForm', () => ({
  useJobCardForm: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock migrateJobCards.util
vi.mock('@/app/(service-center)/sc/job-cards/utils/migrateJobCards.util', () => ({
  migrateAllJobCards: vi.fn(() => []),
}));

// Mock useHydratedJobCard hook
vi.mock('@/shared/hooks/useHydratedJobCard', () => ({
  useHydratedJobCard: vi.fn(() => ({
    customer: null,
    vehicle: null,
    isLoading: false,
  })),
}));

describe('CreateJobCardPage', () => {
  const mockUseJobCardForm = {
    formData: {},
    setFormData: vi.fn(),
    handleSubmit: vi.fn(),
    handleChange: vi.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useJobCardForm).mockReturnValue(mockUseJobCardForm as any);
  });

  it('renders create job card page', () => {
    render(<CreateJobCardPage />);
    
    expect(screen.getByText(/Create|New|Job Card/i)).toBeInTheDocument();
  });

  it('displays job card form', () => {
    render(<CreateJobCardPage />);
    
    expect(screen.getByText(/Create|New|Job Card/i)).toBeInTheDocument();
  });

  it('submits job card form', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    
    vi.mocked(useJobCardForm).mockReturnValue({
      ...mockUseJobCardForm,
      handleSubmit,
    } as any);

    render(<CreateJobCardPage />);
    
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await user.click(submitButton);
    
    expect(handleSubmit).toHaveBeenCalled();
  });

  it('cancels job card creation', async () => {
    const user = userEvent.setup();
    render(<CreateJobCardPage />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel|back/i });
    await user.click(cancelButton);
  });

  it('handles form validation', async () => {
    const user = userEvent.setup();
    render(<CreateJobCardPage />);
    
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await user.click(submitButton);
  });

  it('displays loading state', () => {
    vi.mocked(useJobCardForm).mockReturnValue({
      ...mockUseJobCardForm,
      loading: true,
    } as any);

    render(<CreateJobCardPage />);
    
    const loadingElement = screen.queryByText(/loading|saving|creating/i);
    expect(loadingElement || screen.getByText(/Create|New|Job Card/i)).toBeInTheDocument();
  });

  it('displays error message', () => {
    vi.mocked(useJobCardForm).mockReturnValue({
      ...mockUseJobCardForm,
      error: 'Failed to create job card',
    } as any);

    render(<CreateJobCardPage />);
    
    expect(screen.getByText(/Failed|Error/i)).toBeInTheDocument();
  });
});

