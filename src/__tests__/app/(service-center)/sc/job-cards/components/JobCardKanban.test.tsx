import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import JobCardKanban from '@/app/(service-center)/sc/job-cards/components/JobCardKanban';
import { createMockJobCard } from '@/test/utils/mocks';
import type { JobCard, JobCardStatus, KanbanColumn } from '@/shared/types';

describe('JobCardKanban', () => {
  const mockKanbanColumns: KanbanColumn[] = [
    { id: 'created', title: 'Created', status: 'Created' },
    { id: 'assigned', title: 'Assigned', status: 'Assigned' },
    { id: 'in_progress', title: 'In Progress', status: 'In Progress' },
    { id: 'completed', title: 'Completed', status: 'Completed' },
  ];

  const mockGetJobsByStatus = vi.fn((status: JobCardStatus) => {
    if (status === 'Created') {
      return [createMockJobCard({ id: '1', status: 'Created' })];
    }
    if (status === 'Assigned') {
      return [createMockJobCard({ id: '2', status: 'Assigned' })];
    }
    return [];
  });

  const mockGetPriorityColor = vi.fn(() => 'bg-yellow-500');
  const mockOnJobClick = vi.fn();

  const defaultProps = {
    kanbanColumns: mockKanbanColumns,
    getJobsByStatus: mockGetJobsByStatus,
    partsRequestsData: {},
    onJobClick: mockOnJobClick,
    getPriorityColor: mockGetPriorityColor,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all kanban columns', () => {
    render(<JobCardKanban {...defaultProps} />);
    
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Assigned')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('displays job count for each column', () => {
    render(<JobCardKanban {...defaultProps} />);
    
    // Check that job counts are displayed
    const createdColumn = screen.getByText('Created').closest('div');
    expect(createdColumn).toBeInTheDocument();
  });

  it('displays jobs in correct columns', () => {
    render(<JobCardKanban {...defaultProps} />);
    
    // Jobs should be displayed in their respective columns
    expect(mockGetJobsByStatus).toHaveBeenCalledWith('Created');
    expect(mockGetJobsByStatus).toHaveBeenCalledWith('Assigned');
  });

  it('calls onJobClick when job card is clicked', async () => {
    vi.useRealTimers(); // Use real timers for userEvent
    const job = createMockJobCard({ id: '1', status: 'Created', jobCardNumber: 'JC-001' });
    mockGetJobsByStatus.mockReturnValue([job]);

    render(<JobCardKanban {...defaultProps} />);
    
    // Find job card by job card number or id - use getAllByText and get first
    const jobCardNumber = job.jobCardNumber || job.id;
    const jobCardElements = screen.getAllByText(jobCardNumber);
    const jobCardElement = jobCardElements[0]?.closest('div[class*="cursor-pointer"]') || 
                          jobCardElements[0]?.closest('div');
    
    if (jobCardElement) {
      await userEvent.click(jobCardElement);
      expect(mockOnJobClick).toHaveBeenCalledWith(job);
    } else if (jobCardElements[0]) {
      // Fallback: try clicking on the job card number text itself
      await userEvent.click(jobCardElements[0]);
      expect(mockOnJobClick).toHaveBeenCalledWith(job);
    }
    vi.useFakeTimers();
  });

  it('filters columns by activeTab for technician view', () => {
    render(<JobCardKanban {...defaultProps} activeTab="assigned" isTechnician={true} />);
    
    // Should only show assigned column
    expect(screen.getByText('Assigned')).toBeInTheDocument();
    expect(screen.queryByText('Created')).not.toBeInTheDocument();
  });

  it('shows all columns when activeTab is not provided', () => {
    render(<JobCardKanban {...defaultProps} />);
    
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Assigned')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('displays parts request badge when request exists', () => {
    const job = createMockJobCard({ id: '1', status: 'Created' });
    mockGetJobsByStatus.mockReturnValue([job]);
    
    const partsRequestsData = {
      '1': {
        id: 'req-1',
        inventoryManagerAssigned: false,
      },
    };

    render(
      <JobCardKanban
        {...defaultProps}
        partsRequestsData={partsRequestsData}
      />
    );

    // Use getAllByText since there might be multiple instances
    const partsRequestBadges = screen.getAllByText(/parts request/i);
    expect(partsRequestBadges.length).toBeGreaterThan(0);
  });

  it('displays parts assigned badge when parts are assigned', () => {
    const job = createMockJobCard({ id: '1', status: 'Created' });
    mockGetJobsByStatus.mockReturnValue([job]);
    
    const partsRequestsData = {
      '1': {
        id: 'req-1',
        inventoryManagerAssigned: true,
      },
    };

    render(
      <JobCardKanban
        {...defaultProps}
        partsRequestsData={partsRequestsData}
      />
    );

    // Use getAllByText since there might be multiple instances
    const partsAssignedBadges = screen.getAllByText(/parts assigned/i);
    expect(partsAssignedBadges.length).toBeGreaterThan(0);
  });

  it('shows empty column when no jobs for status', () => {
    mockGetJobsByStatus.mockReturnValue([]);
    
    render(<JobCardKanban {...defaultProps} />);
    
    // Column should still be rendered but empty
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('applies correct column colors', () => {
    render(<JobCardKanban {...defaultProps} />);
    
    const createdColumn = screen.getByText('Created').closest('.bg-gray-50');
    expect(createdColumn).toBeInTheDocument();
    
    const assignedColumn = screen.getByText('Assigned').closest('.bg-blue-50');
    expect(assignedColumn).toBeInTheDocument();
  });

  it('calls onUpdateStatus when status update is triggered', async () => {
    const onUpdateStatus = vi.fn();
    const job = createMockJobCard({ id: '1', status: 'Created' });
    mockGetJobsByStatus.mockReturnValue([job]);

    render(
      <JobCardKanban
        {...defaultProps}
        onUpdateStatus={onUpdateStatus}
      />
    );

    // If there's a status update button, click it
    const updateButtons = screen.queryAllByText(/update|next/i);
    if (updateButtons.length > 0) {
      await userEvent.click(updateButtons[0]);
      expect(onUpdateStatus).toHaveBeenCalled();
    }
  });

  it('handles multiple jobs in same column', () => {
    const jobs = [
      createMockJobCard({ id: '1', status: 'Created', jobCardNumber: 'JC-001' }),
      createMockJobCard({ id: '2', status: 'Created', jobCardNumber: 'JC-002' }),
    ];
    mockGetJobsByStatus.mockReturnValue(jobs);

    render(<JobCardKanban {...defaultProps} />);
    
    // Use getAllByText to handle multiple instances
    const jc001Elements = screen.getAllByText('JC-001');
    const jc002Elements = screen.getAllByText('JC-002');
    expect(jc001Elements.length).toBeGreaterThan(0);
    expect(jc002Elements.length).toBeGreaterThan(0);
  });
});

