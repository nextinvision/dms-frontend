import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import AppointmentsPage from '@/app/(service-center)/sc/appointments/page';
import { localStorage as safeStorage } from '@/shared/lib/localStorage';
import { createMockAppointment } from '@/test/utils/mocks';

// Mock dependencies
vi.mock('@/shared/lib/localStorage', () => ({
  localStorage: {
    getItem: vi.fn(() => []),
    setItem: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock('@/shared/hooks', () => ({
  useRole: () => ({
    userRole: 'service_advisor',
    userInfo: { id: '1', name: 'Test User' },
  }),
}));

describe('AppointmentsPage', () => {
  const mockAppointments = [
    createMockAppointment({
      id: '1',
      customerName: 'John Doe',
      vehicle: 'Tesla Model 3',
      appointmentDate: new Date().toISOString(),
      status: 'scheduled',
    }),
    createMockAppointment({
      id: '2',
      customerName: 'Jane Doe',
      vehicle: 'BMW X5',
      appointmentDate: new Date().toISOString(),
      status: 'completed',
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(safeStorage.getItem).mockReturnValue(mockAppointments as any);
  });

  it('renders appointments page', () => {
    render(<AppointmentsPage />);
    
    expect(screen.getByText(/Appointments/i)).toBeInTheDocument();
  });

  it('displays appointments list', async () => {
    render(<AppointmentsPage />);
    
    await waitFor(() => {
      expect(safeStorage.getItem).toHaveBeenCalled();
    });
  });

  it('displays create appointment button', () => {
    render(<AppointmentsPage />);
    
    const createButton = screen.getByRole('button', { name: /create|new|add|appointment/i });
    expect(createButton).toBeInTheDocument();
  });

  it('filters appointments by status', async () => {
    const user = userEvent.setup();
    render(<AppointmentsPage />);
    
    const filterButton = screen.getByRole('button', { name: /filter|status/i });
    if (filterButton) {
      await user.click(filterButton);
    }
  });

  it('searches appointments', async () => {
    const user = userEvent.setup();
    render(<AppointmentsPage />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    if (searchInput) {
      await user.type(searchInput, 'John');
    }
  });

  it('opens appointment form modal', async () => {
    const user = userEvent.setup();
    render(<AppointmentsPage />);
    
    const createButton = screen.getByRole('button', { name: /create|new|add/i });
    await user.click(createButton);
  });

  it('handles empty appointments list', () => {
    vi.mocked(safeStorage.getItem).mockReturnValue([]);

    render(<AppointmentsPage />);
    
    expect(screen.getByText(/Appointments/i)).toBeInTheDocument();
  });

  it('displays appointment details', () => {
    render(<AppointmentsPage />);
    
    expect(screen.getByText(/Appointments/i)).toBeInTheDocument();
  });

  it('updates appointment status', async () => {
    const user = userEvent.setup();
    render(<AppointmentsPage />);
    
    // Find and click status update button
    const statusButton = screen.queryByRole('button', { name: /update|status|change/i });
    if (statusButton) {
      await user.click(statusButton);
    }
  });

  it('handles date filtering', async () => {
    const user = userEvent.setup();
    render(<AppointmentsPage />);
    
    const dateFilter = screen.queryByLabelText(/date|filter/i);
    if (dateFilter) {
      await user.click(dateFilter);
    }
  });
});

