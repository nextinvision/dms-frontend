import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import { FilterBar } from "@/components/ui/FilterBar";

describe('FilterBar', () => {
  const mockFilters = [
    { key: 'status', label: 'Status', value: 'Active' },
    { key: 'type', label: 'Type', value: 'Premium' },
  ];

  it('returns null when filters array is empty', () => {
    const { container } = render(<FilterBar filters={[]} onRemoveFilter={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders filter chips', () => {
    render(<FilterBar filters={mockFilters} onRemoveFilter={vi.fn()} />);
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Type:')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('calls onRemoveFilter when filter chip close button is clicked', async () => {
    const onRemoveFilter = vi.fn();
    render(<FilterBar filters={mockFilters} onRemoveFilter={onRemoveFilter} />);
    
    const closeButtons = screen.getAllByRole('button');
    // First two buttons are close buttons for filters
    await userEvent.click(closeButtons[0]);
    
    expect(onRemoveFilter).toHaveBeenCalledWith('status');
  });

  it('renders clear all button when onClearAll is provided', () => {
    render(
      <FilterBar
        filters={mockFilters}
        onRemoveFilter={vi.fn()}
        onClearAll={vi.fn()}
      />
    );
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('does not render clear all button when onClearAll is not provided', () => {
    render(<FilterBar filters={mockFilters} onRemoveFilter={vi.fn()} />);
    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
  });

  it('calls onClearAll when clear all button is clicked', async () => {
    const onClearAll = vi.fn();
    render(
      <FilterBar
        filters={mockFilters}
        onRemoveFilter={vi.fn()}
        onClearAll={onClearAll}
      />
    );
    
    const clearAllButton = screen.getByText('Clear All');
    await userEvent.click(clearAllButton);
    
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <FilterBar
        filters={mockFilters}
        onRemoveFilter={vi.fn()}
        className="custom-filter-bar"
      />
    );
    const wrapper = container.querySelector('.custom-filter-bar');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders multiple filters correctly', () => {
    const manyFilters = [
      { key: 'status', label: 'Status', value: 'Active' },
      { key: 'type', label: 'Type', value: 'Premium' },
      { key: 'category', label: 'Category', value: 'Electronics' },
    ];
    
    render(<FilterBar filters={manyFilters} onRemoveFilter={vi.fn()} />);
    
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Type:')).toBeInTheDocument();
    expect(screen.getByText('Category:')).toBeInTheDocument();
  });
});

