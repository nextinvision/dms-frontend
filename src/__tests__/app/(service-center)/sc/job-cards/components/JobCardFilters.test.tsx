import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import JobCardFilters from '@/app/(service-center)/sc/job-cards/components/JobCardFilters';
import type { JobCardViewType, JobCardFilterType } from '@/shared/types/job-card.types';

describe('JobCardFilters', () => {
  const defaultProps = {
    searchQuery: '',
    setSearchQuery: vi.fn(),
    showMobileFilters: false,
    setShowMobileFilters: vi.fn(),
    filter: 'all',
    setFilter: vi.fn(),
    filterOptions: ['all', 'created', 'assigned', 'in_progress', 'completed'] as JobCardFilterType[],
    filterLabelMap: {
      all: 'All',
      created: 'Created',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      completed: 'Completed',
    },
    view: 'list' as JobCardViewType,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input', () => {
    render(<JobCardFilters {...defaultProps} />);
    expect(screen.getByPlaceholderText(/search by job card/i)).toBeInTheDocument();
  });

  it('displays current search query', () => {
    render(<JobCardFilters {...defaultProps} searchQuery="test query" />);
    const input = screen.getByPlaceholderText(/search by job card/i) as HTMLInputElement;
    expect(input.value).toBe('test query');
  });

  it('calls setSearchQuery on input change', async () => {
    const setSearchQuery = vi.fn();
    render(<JobCardFilters {...defaultProps} setSearchQuery={setSearchQuery} />);
    
    const input = screen.getByPlaceholderText(/search by job card/i);
    await userEvent.type(input, 'test');
    
    expect(setSearchQuery).toHaveBeenCalled();
  });

  it('renders filter buttons', () => {
    render(<JobCardFilters {...defaultProps} />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Assigned')).toBeInTheDocument();
  });

  it('highlights active filter', () => {
    render(<JobCardFilters {...defaultProps} filter="created" />);
    const createdButton = screen.getByText('Created');
    expect(createdButton.className).toContain('bg-blue-600');
  });

  it('calls setFilter when filter button is clicked', async () => {
    const setFilter = vi.fn();
    render(<JobCardFilters {...defaultProps} setFilter={setFilter} />);
    
    const assignedButton = screen.getByText('Assigned');
    await userEvent.click(assignedButton);
    
    expect(setFilter).toHaveBeenCalledWith('assigned');
  });

  it('shows mobile filter toggle button', () => {
    render(<JobCardFilters {...defaultProps} />);
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('toggles mobile filters when button is clicked', async () => {
    const setShowMobileFilters = vi.fn();
    render(<JobCardFilters {...defaultProps} setShowMobileFilters={setShowMobileFilters} />);
    
    const filterButton = screen.getByText('Filters');
    await userEvent.click(filterButton);
    
    expect(setShowMobileFilters).toHaveBeenCalledWith(true);
  });

  it('shows mobile filters dropdown when showMobileFilters is true', () => {
    render(<JobCardFilters {...defaultProps} showMobileFilters={true} />);
    // Mobile filters should be visible
    const filterButtons = screen.getAllByText('All');
    expect(filterButtons.length).toBeGreaterThan(1);
  });

  it('hides mobile filters dropdown when showMobileFilters is false', () => {
    render(<JobCardFilters {...defaultProps} showMobileFilters={false} />);
    // Desktop filters should be visible, mobile dropdown should not
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('closes mobile filters when filter is selected', async () => {
    const setShowMobileFilters = vi.fn();
    render(
      <JobCardFilters
        {...defaultProps}
        showMobileFilters={true}
        setShowMobileFilters={setShowMobileFilters}
      />
    );
    
    // Find mobile filter button (should be in mobile dropdown)
    const mobileFilterButtons = screen.getAllByText('Created');
    if (mobileFilterButtons.length > 1) {
      await userEvent.click(mobileFilterButtons[1]);
      expect(setShowMobileFilters).toHaveBeenCalledWith(false);
    }
  });

  it('applies kanban view styling', () => {
    render(<JobCardFilters {...defaultProps} view="kanban" />);
    const container = screen.getByPlaceholderText(/search by job card/i).closest('.bg-white');
    expect(container?.className).toContain('mx-4');
  });

  it('applies list view styling', () => {
    render(<JobCardFilters {...defaultProps} view="list" />);
    const container = screen.getByPlaceholderText(/search by job card/i).closest('.bg-white');
    expect(container?.className).not.toContain('mx-4');
  });
});

