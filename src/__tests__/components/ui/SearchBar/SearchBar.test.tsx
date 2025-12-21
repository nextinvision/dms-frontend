import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import { SearchBar } from "@/components/ui/SearchBar";

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders search input', () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('displays custom placeholder', () => {
    render(<SearchBar placeholder="Search customers..." />);
    expect(screen.getByPlaceholderText('Search customers...')).toBeInTheDocument();
  });

  it('displays search icon', () => {
    const { container } = render(<SearchBar />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('updates input value on change', async () => {
    vi.useRealTimers(); // Use real timers for userEvent
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    await userEvent.type(input, 'test query');
    expect(input.value).toBe('test query');
    vi.useFakeTimers(); // Restore fake timers
  });

  it('calls onSearch with debounce', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} debounceMs={300} />);
    
    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    
    // Type with real timers
    vi.useRealTimers();
    await userEvent.type(input, 'test');
    vi.useFakeTimers();
    
    // Should not be called immediately
    expect(onSearch).not.toHaveBeenCalled();
    
    // Advance timers past debounce
    vi.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('test');
    });
  });

  it('calls onSearch immediately when debounceMs is 0', async () => {
    vi.useRealTimers();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} debounceMs={0} />);
    
    const input = screen.getByPlaceholderText('Search...');
    await userEvent.type(input, 'test');
    
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('test');
    });
    vi.useFakeTimers();
  });

  it('shows clear button when query has value', () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    
    // Initially no clear button
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    
    // Type something
    userEvent.type(input, 'test');
    
    // Clear button should appear
    waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('clears input when clear button is clicked', async () => {
    vi.useRealTimers();
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    
    await userEvent.type(input, 'test query');
    expect(input.value).toBe('test query');
    
    const clearButton = screen.getByRole('button');
    await userEvent.click(clearButton);
    
    expect(input.value).toBe('');
    vi.useFakeTimers();
  });

  it('calls onClear when clear button is clicked', async () => {
    vi.useRealTimers();
    const onClear = vi.fn();
    render(<SearchBar onClear={onClear} />);
    
    const input = screen.getByPlaceholderText('Search...');
    await userEvent.type(input, 'test');
    
    const clearButton = screen.getByRole('button');
    await userEvent.click(clearButton);
    
    expect(onClear).toHaveBeenCalledTimes(1);
    vi.useFakeTimers();
  });

  it('calls onSearch with empty string when cleared', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    
    vi.useRealTimers();
    const input = screen.getByPlaceholderText('Search...');
    await userEvent.type(input, 'test');
    vi.useFakeTimers();
    
    vi.advanceTimersByTime(300);
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalled();
    });
    
    vi.useRealTimers();
    const clearButton = screen.getByRole('button');
    await userEvent.click(clearButton);
    vi.useFakeTimers();
    
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('');
    });
  });

  it('applies custom className', () => {
    const { container } = render(<SearchBar className="custom-search" />);
    const wrapper = container.querySelector('.custom-search');
    expect(wrapper).toBeInTheDocument();
  });

  it('passes through other input props', () => {
    render(<SearchBar disabled data-testid="search-input" />);
    const input = screen.getByTestId('search-input');
    expect(input).toBeDisabled();
  });
});

