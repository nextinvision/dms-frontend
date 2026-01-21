/**
 * Professional Toast Notification Utility
 * Replaces all browser alert(), confirm(), and prompt() calls with modern toast notifications
 */

import toast, { ToastOptions } from 'react-hot-toast';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig extends Omit<ToastOptions, 'duration'> {
  duration?: number;
}

/**
 * Default toast configuration
 */
const defaultConfig: ToastConfig = {
  duration: 4000,
  position: 'top-center',
  style: {
    borderRadius: '8px',
    background: '#363636',
    color: '#fff',
    padding: '16px',
    fontSize: '14px',
    maxWidth: '500px',
  },
  className: 'toast-notification',
};

/**
 * Success toast notification
 */
export const showSuccess = (message: string, config?: ToastConfig) => {
  return toast.success(message, {
    ...defaultConfig,
    ...config,
    icon: '✓',
    style: {
      ...defaultConfig.style,
      borderLeft: '4px solid #10b981',
      ...config?.style,
    },
  });
};

/**
 * Error toast notification
 */
export const showError = (message: string, config?: ToastConfig) => {
  return toast.error(message, {
    ...defaultConfig,
    ...config,
    duration: config?.duration || 5000, // Errors show longer
    icon: '✕',
    style: {
      ...defaultConfig.style,
      borderLeft: '4px solid #ef4444',
      ...config?.style,
    },
  });
};

/**
 * Warning toast notification
 */
export const showWarning = (message: string, config?: ToastConfig) => {
  return toast(message, {
    ...defaultConfig,
    ...config,
    icon: '⚠',
    style: {
      ...defaultConfig.style,
      borderLeft: '4px solid #f59e0b',
      ...config?.style,
    },
  });
};

/**
 * Info toast notification
 */
export const showInfo = (message: string, config?: ToastConfig) => {
  return toast(message, {
    ...defaultConfig,
    ...config,
    icon: 'ℹ',
    style: {
      ...defaultConfig.style,
      borderLeft: '4px solid #3b82f6',
      ...config?.style,
    },
  });
};

/**
 * Show toast based on type
 */
export const showToast = (message: string, type: ToastType = 'info', config?: ToastConfig) => {
  switch (type) {
    case 'success':
      return showSuccess(message, config);
    case 'error':
      return showError(message, config);
    case 'warning':
      return showWarning(message, config);
    case 'info':
    default:
      return showInfo(message, config);
  }
};

/**
 * Replace browser alert() - automatically determines type from message
 */
export const alertToast = (message: string, type?: ToastType) => {
  if (type) {
    return showToast(message, type);
  }

  // Auto-detect type from message content
  const lowerMessage = message.toLowerCase();
  
  if (
    lowerMessage.includes('success') ||
    lowerMessage.includes('successfully') ||
    lowerMessage.includes('approved') ||
    lowerMessage.includes('saved') ||
    lowerMessage.includes('created') ||
    lowerMessage.includes('updated') ||
    lowerMessage.includes('sent') ||
    lowerMessage.includes('assigned') ||
    lowerMessage.includes('generated')
  ) {
    return showSuccess(message);
  }
  
  if (
    lowerMessage.includes('error') ||
    lowerMessage.includes('failed') ||
    lowerMessage.includes('fail') ||
    lowerMessage.includes('rejected') ||
    lowerMessage.includes('denied') ||
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('not found') ||
    lowerMessage.includes('cannot')
  ) {
    return showError(message);
  }
  
  if (
    lowerMessage.includes('warning') ||
    lowerMessage.includes('please') ||
    lowerMessage.includes('required') ||
    lowerMessage.includes('missing') ||
    lowerMessage.includes('must')
  ) {
    return showWarning(message);
  }
  
  return showInfo(message);
};

/**
 * Loading toast - useful for async operations
 */
export const showLoading = (message: string) => {
  return toast.loading(message, {
    ...defaultConfig,
    duration: Infinity,
  });
};

/**
 * Dismiss a toast by its ID
 */
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAll = () => {
  toast.dismiss();
};

/**
 * Promise toast - automatically shows success/error based on promise result
 */
export const promiseToast = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    defaultConfig
  );
};

