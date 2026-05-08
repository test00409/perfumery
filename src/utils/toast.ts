/**
 * Centralized Toast Notification Utility
 * 
 * This file provides a unified interface for displaying toast notifications
 * across the entire application. All toast logic is centralized here for
 * easy maintenance and consistent styling.
 * 
 * Usage:
 *   import { showToast } from '@/utils/toast';
 *   
 *   showToast.success('Operation successful!');
 *   showToast.error('Something went wrong');
 *   showToast.info('Here is some information');
 *   showToast.loading('Processing...');
 */

import toast, { ToastOptions } from 'react-hot-toast';

const defaultToastOptions: ToastOptions = {
  duration: 2000,
  position: 'top-right',
  style: {
    fontFamily: 'var(--font-outfit-light)',
    background: 'rgba(18, 18, 18, 0.9)',
    color: '#fff',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '14px',
    maxWidth: '400px',
  },
};

const successOptions: ToastOptions = {
  ...defaultToastOptions,
  icon: '✅',
  style: {
    ...defaultToastOptions.style,
    background: 'rgba(34, 197, 94, 0.9)',
  },
};

const errorOptions: ToastOptions = {
  ...defaultToastOptions,
  icon: '❌',
  duration: 2000,
  style: {
    ...defaultToastOptions.style,
    background: 'rgba(239, 68, 68, 0.9)',
  },
};

const infoOptions: ToastOptions = {
  ...defaultToastOptions,
  icon: 'ℹ️',
  style: {
    ...defaultToastOptions.style,
    background: 'rgba(59, 130, 246, 0.9)',
  },
};

const warningOptions: ToastOptions = {
  ...defaultToastOptions,
  icon: '⚠️',
  style: {
    ...defaultToastOptions.style,
    background: 'rgba(234, 179, 8, 0.9)',
  },
};

/**
 * Centralized Toast Utility Object
 * 
 * Provides methods for different types of toast notifications:
 * - success: For successful operations
 * - error: For errors and failures
 * - info: For informational messages
 * - warning: For warnings
 * - loading: For loading states (returns a toast ID for dismissal)
 * - dismiss: To dismiss a specific toast by ID
 * - custom: For custom toast messages with custom options
 */
export const showToast = {
  /**
   * Display a success toast notification
   * @param message - The success message to display
   * @param options - Optional custom toast options
   * @returns Toast ID
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      ...successOptions,
      ...options,
      style: {
        ...successOptions.style,
        ...options?.style,
      },
    });
  },

  /**
   * Display an error toast notification
   * @param message - The error message to display
   * @param options - Optional custom toast options
   * @returns Toast ID
   */
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      ...errorOptions,
      ...options,
      style: {
        ...errorOptions.style,
        ...options?.style,
      },
    });
  },

  /**
   * Display an info toast notification
   * @param message - The info message to display
   * @param options - Optional custom toast options
   * @returns Toast ID
   */
  info: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...infoOptions,
      ...options,
      style: {
        ...infoOptions.style,
        ...options?.style,
      },
    });
  },

  /**
   * Display a warning toast notification
   * @param message - The warning message to display
   * @param options - Optional custom toast options
   * @returns Toast ID
   */
  warning: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...warningOptions,
      ...options,
      style: {
        ...warningOptions.style,
        ...options?.style,
      },
    });
  },

  /**
   * Display a loading toast notification
   * @param message - The loading message to display
   * @param options - Optional custom toast options
   * @returns Toast ID (use this to dismiss the loading toast)
   */
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...defaultToastOptions,
      ...options,
      style: {
        ...defaultToastOptions.style,
        ...options?.style,
      },
    });
  },

  /**
   * Dismiss a specific toast by ID
   * @param toastId - The ID of the toast to dismiss
   */
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all active toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },

  /**
   * Display a custom toast notification
   * @param message - The message to display
   * @param options - Custom toast options
   * @returns Toast ID
   */
  custom: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...defaultToastOptions,
      ...options,
      style: {
        ...defaultToastOptions.style,
        ...options?.style,
      },
    });
  },

  /**
   * Promise-based toast notification
   * Automatically shows loading, then success/error based on promise result
   * @param promise - The promise to track
   * @param messages - Object with loading, success, and error messages
   * @returns The promise result
   */
  promise: <T,>(
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
      {
        ...defaultToastOptions,
        style: {
          ...defaultToastOptions.style,
        },
      }
    );
  },
};

export { toast };
export default showToast;
