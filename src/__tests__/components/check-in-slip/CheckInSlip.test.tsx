import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import CheckInSlip from '@/components/check-in-slip/CheckInSlip';
import type { CheckInSlipData } from '@/components/check-in-slip/CheckInSlip';

// Mock window.print
const mockPrint = vi.fn();
window.print = mockPrint;

describe('CheckInSlip', () => {
  const mockData: CheckInSlipData = {
    slipNumber: 'CIS-001',
    customerName: 'John Doe',
    phone: '+1234567890',
    email: 'john@example.com',
    vehicleMake: 'Tesla',
    vehicleModel: 'Model 3',
    registrationNumber: 'ABC123',
    vin: 'VIN123456',
    checkInDate: '2024-01-15',
    checkInTime: '10:30:00',
    serviceCenterName: 'Test Service Center',
    serviceCenterAddress: '123 Test St',
    serviceCenterCity: 'Test City',
    serviceCenterState: 'Test State',
    serviceCenterPincode: '12345',
    serviceCenterPhone: '+9876543210',
    expectedServiceDate: '2024-01-20',
    serviceType: 'General Service',
    notes: 'Test notes',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders check-in slip with all data', () => {
    render(<CheckInSlip data={mockData} />);

    expect(screen.getByText('Check-in Slip')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Tesla Model 3')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('CIS-001')).toBeInTheDocument();
  });

  it('displays service center information', () => {
    render(<CheckInSlip data={mockData} />);

    expect(screen.getByText('Test Service Center')).toBeInTheDocument();
    expect(screen.getByText(/123 Test St/i)).toBeInTheDocument();
    expect(screen.getByText(/Test City/i)).toBeInTheDocument();
  });

  it('displays check-in date and time', () => {
    render(<CheckInSlip data={mockData} />);

    expect(screen.getByText(/2024-01-15/i)).toBeInTheDocument();
    expect(screen.getByText(/10:30/i)).toBeInTheDocument();
  });

  it('displays optional fields when provided', () => {
    render(<CheckInSlip data={mockData} />);

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('VIN123456')).toBeInTheDocument();
    expect(screen.getByText('2024-01-20')).toBeInTheDocument();
    expect(screen.getByText('Test notes')).toBeInTheDocument();
  });

  it('handles missing optional fields', () => {
    const minimalData: CheckInSlipData = {
      slipNumber: 'CIS-002',
      customerName: 'Jane Doe',
      phone: '+1234567890',
      vehicleMake: 'Tesla',
      vehicleModel: 'Model Y',
      registrationNumber: 'XYZ789',
      checkInDate: '2024-01-15',
      checkInTime: '10:30:00',
      serviceCenterName: 'Test Service Center',
      serviceCenterAddress: '123 Test St',
      serviceCenterCity: 'Test City',
      serviceCenterState: 'Test State',
      serviceCenterPincode: '12345',
    };

    render(<CheckInSlip data={minimalData} />);

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Tesla Model Y')).toBeInTheDocument();
  });

  it('calls print when print button is clicked', async () => {
    vi.useRealTimers();
    render(<CheckInSlip data={mockData} showActions={true} />);

    const printButton = screen.getByText('Print');
    await userEvent.click(printButton);

    expect(mockPrint).toHaveBeenCalled();
    vi.useFakeTimers();
  });

  it('calls download PDF when download button is clicked', async () => {
    vi.useRealTimers();
    render(<CheckInSlip data={mockData} showActions={true} />);

    const downloadButton = screen.getByText('Download PDF');
    await userEvent.click(downloadButton);

    expect(mockPrint).toHaveBeenCalled();
    vi.useFakeTimers();
  });

  it('calls onClose when close button is clicked', async () => {
    vi.useRealTimers();
    const onClose = vi.fn();
    render(<CheckInSlip data={mockData} onClose={onClose} showActions={true} />);

    const closeButton = screen.getByLabelText('Close');
    await userEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
    vi.useFakeTimers();
  });

  it('calls onSendToCustomer when send button is clicked', async () => {
    vi.useRealTimers();
    const onSendToCustomer = vi.fn();
    render(
      <CheckInSlip
        data={mockData}
        onSendToCustomer={onSendToCustomer}
        showActions={true}
      />
    );

    const sendButton = screen.getByText('Send to Customer');
    await userEvent.click(sendButton);

    expect(onSendToCustomer).toHaveBeenCalled();
    vi.useFakeTimers();
  });

  it('hides actions when showActions is false', () => {
    render(<CheckInSlip data={mockData} showActions={false} />);

    expect(screen.queryByText('Print')).not.toBeInTheDocument();
    expect(screen.queryByText('Download PDF')).not.toBeInTheDocument();
  });

  it('formats time correctly', () => {
    const dataWithTime: CheckInSlipData = {
      ...mockData,
      checkInTime: '14:30:00',
    };

    render(<CheckInSlip data={dataWithTime} />);

    // Should display in 12-hour format
    expect(screen.getByText(/2:30 PM/i)).toBeInTheDocument();
  });

  it('formats date correctly', () => {
    render(<CheckInSlip data={mockData} />);

    // Date should be formatted in readable format
    const dateElement = screen.getByText(/January/i);
    expect(dateElement).toBeInTheDocument();
  });
});

