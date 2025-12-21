/**
 * Test Template Generator
 * This script helps generate test file templates for components, services, hooks, etc.
 * 
 * Usage: This is a reference template, not an executable script.
 * Copy and modify these templates to create new test files.
 */

// ============================================================================
// COMPONENT TEST TEMPLATE
// ============================================================================
export const componentTestTemplate = `
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ComponentName />);
    expect(screen.getByTestId('component-name')).toBeInTheDocument();
  });

  it('displays correct content', () => {
    render(<ComponentName>Test Content</ComponentName>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const handleClick = vi.fn();
    render(<ComponentName onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles props correctly', () => {
    render(<ComponentName prop1="value1" prop2={123} />);
    // Add assertions for props
  });

  it('shows loading state', () => {
    render(<ComponentName isLoading />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<ComponentName error="Error message" />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    render(<ComponentName items={[]} />);
    expect(screen.getByText(/no items/i)).toBeInTheDocument();
  });
});
`;

// ============================================================================
// SERVICE TEST TEMPLATE
// ============================================================================
export const serviceTestTemplate = `
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { serviceName } from '../serviceName';
import { createMockData } from '@/test/utils/mocks';

// Mock dependencies
vi.mock('@/core/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ServiceName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('returns all items', async () => {
      const mockData = [createMockData({ id: '1' })];
      // Mock API response
      
      const result = await serviceName.getAll();
      
      expect(result).toEqual(mockData);
    });

    it('handles empty results', async () => {
      // Mock empty response
      const result = await serviceName.getAll();
      
      expect(result).toEqual([]);
    });

    it('handles API errors', async () => {
      // Mock error response
      await expect(serviceName.getAll()).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('returns item by id', async () => {
      const mockData = createMockData({ id: '1' });
      // Mock API response
      
      const result = await serviceName.getById('1');
      
      expect(result).toEqual(mockData);
    });

    it('throws error for non-existent id', async () => {
      await expect(serviceName.getById('999')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates new item', async () => {
      const newData = { name: 'New Item' };
      const mockData = createMockData({ ...newData, id: '1' });
      // Mock API response
      
      const result = await serviceName.create(newData);
      
      expect(result).toEqual(mockData);
    });

    it('validates required fields', async () => {
      await expect(serviceName.create({})).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('updates existing item', async () => {
      const updateData = { name: 'Updated' };
      // Mock API response
      
      const result = await serviceName.update('1', updateData);
      
      expect(result.name).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('deletes item', async () => {
      // Mock API response
      await serviceName.delete('1');
      
      // Verify deletion
    });
  });
});
`;

// ============================================================================
// HOOK TEST TEMPLATE
// ============================================================================
export const hookTestTemplate = `
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHookName } from '../useHookName';
import { createMockData } from '@/test/utils/mocks';

// Mock dependencies
vi.mock('@/features/service/service', () => ({
  serviceName: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useHookName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useHookName());
    
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('fetches data on mount', async () => {
    const mockData = [createMockData({ id: '1' })];
    // Mock service response
    
    const { result } = renderHook(() => useHookName());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.data).toEqual(mockData);
  });

  it('handles loading state', () => {
    const { result } = renderHook(() => useHookName());
    
    expect(result.current.isLoading).toBe(true);
  });

  it('handles error state', async () => {
    // Mock error response
    
    const { result } = renderHook(() => useHookName());
    
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });

  it('updates state correctly', async () => {
    const { result } = renderHook(() => useHookName());
    
    // Trigger state update
    await result.current.updateData({ name: 'Updated' });
    
    await waitFor(() => {
      expect(result.current.data.name).toBe('Updated');
    });
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useHookName());
    
    unmount();
    
    // Verify cleanup
  });
});
`;

// ============================================================================
// UTILITY TEST TEMPLATE
// ============================================================================
export const utilityTestTemplate = `
import { describe, it, expect } from 'vitest';
import { utilityFunction } from '../utilityFile';

describe('utilityFunction', () => {
  it('handles normal input', () => {
    const result = utilityFunction('input');
    expect(result).toBe('expected output');
  });

  it('handles edge cases', () => {
    expect(utilityFunction('')).toBe('');
    expect(utilityFunction(null)).toBe(null);
    expect(utilityFunction(undefined)).toBe(undefined);
  });

  it('handles invalid input', () => {
    expect(() => utilityFunction('invalid')).toThrow();
  });

  it('returns correct type', () => {
    const result = utilityFunction('input');
    expect(typeof result).toBe('string');
  });

  it('is pure function (no side effects)', () => {
    const input = 'test';
    const result1 = utilityFunction(input);
    const result2 = utilityFunction(input);
    
    expect(result1).toBe(result2);
    expect(input).toBe('test'); // Input unchanged
  });
});
`;

// ============================================================================
// PAGE TEST TEMPLATE
// ============================================================================
export const pageTestTemplate = `
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import Page from '../page';

// Mock Next.js
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/page',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock services
vi.mock('@/features/service/service', () => ({
  serviceName: {
    getAll: vi.fn(),
  },
}));

describe('Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('fetches and displays data', async () => {
    // Mock data
    const mockData = [{ id: '1', name: 'Item 1' }];
    // Mock service response
    
    render(<Page />);
    
    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    render(<Page />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles empty state', async () => {
    // Mock empty response
    
    render(<Page />);
    
    await waitFor(() => {
      expect(screen.getByText(/no data/i)).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    // Mock error response
    
    render(<Page />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('handles user interactions', async () => {
    render(<Page />);
    
    const button = screen.getByRole('button', { name: /action/i });
    // Test interaction
  });
});
`;

// ============================================================================
// INTEGRATION TEST TEMPLATE
// ============================================================================
export const integrationTestTemplate = `
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import { FlowComponent } from '../FlowComponent';

// Mock all external dependencies
vi.mock('@/features/service1/service', () => ({
  service1: {
    method1: vi.fn(),
  },
}));

vi.mock('@/features/service2/service', () => ({
  service2: {
    method2: vi.fn(),
  },
}));

describe('Integration: FlowName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes full user flow', async () => {
    // Step 1: Initial render
    render(<FlowComponent />);
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();

    // Step 2: User interaction
    const button = screen.getByRole('button', { name: /next/i });
    await userEvent.click(button);

    // Step 3: Verify state change
    await waitFor(() => {
      expect(screen.getByText(/step 2/i)).toBeInTheDocument();
    });

    // Step 4: Complete flow
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);

    // Step 5: Verify completion
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });

  it('handles errors in flow', async () => {
    // Mock error at specific step
    render(<FlowComponent />);
    
    // Trigger error condition
    // Verify error handling
  });

  it('validates data between steps', async () => {
    render(<FlowComponent />);
    
    // Test validation logic
  });
});
`;

