/**
 * Test helper functions
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Wait for element to appear
 */
export const waitForElement = async (testId: string) => {
  return waitFor(() => screen.getByTestId(testId));
};

/**
 * Wait for text to appear
 */
export const waitForText = async (text: string | RegExp) => {
  return waitFor(() => screen.getByText(text));
};

/**
 * Fill form field
 */
export const fillField = async (
  label: string | RegExp,
  value: string
) => {
  const field = screen.getByLabelText(label);
  await userEvent.clear(field);
  await userEvent.type(field, value);
};

/**
 * Select option from dropdown
 */
export const selectOption = async (
  label: string | RegExp,
  option: string
) => {
  const select = screen.getByLabelText(label);
  await userEvent.selectOptions(select, option);
};

/**
 * Click button by text
 */
export const clickButton = async (text: string | RegExp) => {
  const button = screen.getByRole('button', { name: text });
  await userEvent.click(button);
};

/**
 * Click element by test id
 */
export const clickByTestId = async (testId: string) => {
  const element = screen.getByTestId(testId);
  await userEvent.click(element);
};

/**
 * Submit form
 */
export const submitForm = async () => {
  const form = screen.getByRole('form') || document.querySelector('form');
  if (form) {
    await userEvent.click(screen.getByRole('button', { name: /submit|save|create|update/i }));
  }
};

/**
 * Check if element is visible
 */
export const isVisible = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
};

/**
 * Mock localStorage
 */
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
};

/**
 * Mock sessionStorage
 */
export const mockSessionStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
};

/**
 * Create mock file for file input
 */
export const createMockFile = (
  name: string,
  type: string = 'text/plain',
  content: string = 'test content'
): File => {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
};

/**
 * Wait for async operations to complete
 */
export const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Mock window.location
 */
export const mockWindowLocation = (url: string) => {
  delete (window as any).location;
  (window as any).location = new URL(url);
};

/**
 * Mock IntersectionObserver
 */
export const mockIntersectionObserver = () => {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as any;
};

/**
 * Mock ResizeObserver
 */
export const mockResizeObserver = () => {
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  } as any;
};

