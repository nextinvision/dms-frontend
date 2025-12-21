import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@/test/utils/render';
import { TopLoadingBar } from "@/components/ui/TopLoadingBar";

describe('TopLoadingBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('does not render when isLoading is false', () => {
    const { container } = render(<TopLoadingBar isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when isLoading is true', () => {
    const { container } = render(<TopLoadingBar isLoading={true} />);
    const bar = container.querySelector('.fixed.top-0');
    expect(bar).toBeInTheDocument();
  });

  it('starts at 0% progress', () => {
    const { container } = render(<TopLoadingBar isLoading={true} />);
    const progressBar = container.querySelector('.h-full') as HTMLElement;
    expect(progressBar?.style.width).toBe('0%');
  });

  it('increments progress over time', async () => {
    const { container } = render(<TopLoadingBar isLoading={true} />);
    
    // Wait for component to mount and set up interval
    await waitFor(() => {
      const progressBar = container.querySelector('.h-full') as HTMLElement;
      expect(progressBar).toBeInTheDocument();
    });
    
    // Advance timers to trigger progress updates (interval runs every 100ms)
    vi.advanceTimersByTime(200);
    
    await waitFor(() => {
      const progressBar = container.querySelector('.h-full') as HTMLElement;
      const width = parseFloat(progressBar?.style.width || '0');
      expect(width).toBeGreaterThan(0);
    }, { timeout: 1000 });
  });

  it('caps progress at 90% while loading', async () => {
    const { container } = render(<TopLoadingBar isLoading={true} />);
    
    // Wait for component to mount
    await waitFor(() => {
      const progressBar = container.querySelector('.h-full') as HTMLElement;
      expect(progressBar).toBeInTheDocument();
    });
    
    // Advance timers significantly (interval runs every 100ms)
    vi.advanceTimersByTime(2000);
    
    await waitFor(() => {
      const progressBar = container.querySelector('.h-full') as HTMLElement;
      const width = parseFloat(progressBar?.style.width || '0');
      expect(width).toBeLessThanOrEqual(90);
    }, { timeout: 1000 });
  });

  it('completes to 100% when loading stops', async () => {
    const { container, rerender } = render(<TopLoadingBar isLoading={true} />);
    
    // Wait for component to mount
    await waitFor(() => {
      const progressBar = container.querySelector('.h-full') as HTMLElement;
      expect(progressBar).toBeInTheDocument();
    });
    
    // Let it progress
    vi.advanceTimersByTime(500);
    
    // Stop loading
    rerender(<TopLoadingBar isLoading={false} />);
    
    // Advance timers to allow state update
    vi.advanceTimersByTime(100);
    
    await waitFor(() => {
      const progressBar = container.querySelector('.h-full') as HTMLElement;
      expect(progressBar?.style.width).toBe('100%');
    }, { timeout: 1000 });
  });

  it('hides after completion', async () => {
    const { container, rerender } = render(<TopLoadingBar isLoading={true} />);
    
    // Wait for component to mount
    await waitFor(() => {
      const progressBar = container.querySelector('.h-full') as HTMLElement;
      expect(progressBar).toBeInTheDocument();
    });
    
    vi.advanceTimersByTime(500);
    rerender(<TopLoadingBar isLoading={false} />);
    
    // Advance past hide timeout (300ms after completion)
    vi.advanceTimersByTime(400);
    
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    }, { timeout: 1000 });
  });

  it('has correct styling', () => {
    const { container } = render(<TopLoadingBar isLoading={true} />);
    const bar = container.querySelector('.fixed.top-0');
    expect(bar?.className).toContain('z-[100]');
    expect(bar?.className).toContain('h-1');
  });
});

