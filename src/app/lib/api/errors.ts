/**
 * API Error Handling Utilities
 * Centralized error handling for API calls with authentication support
 */

import { AxiosError, AxiosResponse } from 'axios';
import { useAuthStore } from '@/lib/stores/auth-store';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class ApiErrorHandler {
  /**
   * Handle API errors with authentication-specific logic
   */
  static handleError(error: AxiosError | Error): ApiError {
    // Handle Axios errors
    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error);
    }

    // Handle generic errors
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }

  /**
   * Check if error is an Axios error
   */
  private static isAxiosError(error: any): error is AxiosError {
    return error.isAxiosError === true;
  }

  /**
   * Handle Axios-specific errors
   */
  private static handleAxiosError(error: AxiosError): ApiError {
    const status = error.response?.status;
    const data = error.response?.data as any;

    // Handle authentication errors
    if (status === 401) {
      return this.handleUnauthorizedError(error, data);
    }

    // Handle forbidden errors
    if (status === 403) {
      return this.handleForbiddenError(error, data);
    }

    // Handle validation errors (422)
    if (status === 422) {
      return this.handleValidationError(error, data);
    }

    // Handle server errors (5xx)
    if (status && status >= 500) {
      return this.handleServerError(error, data);
    }

    // Handle network errors
    if (!error.response) {
      return this.handleNetworkError(error);
    }

    // Handle other HTTP errors
    return {
      message: data?.detail || data?.message || error.message || 'Request failed',
      status,
      code: `HTTP_${status}`,
      details: data,
    };
  }

  /**
   * Handle 401 Unauthorized errors
   */
  private static handleUnauthorizedError(error: AxiosError, data: any): ApiError {
    const message = data?.detail || 'Authentication required';

    // Automatically logout user on 401
    setTimeout(() => {
      useAuthStore.getState().logout();
    }, 100);

    return {
      message,
      status: 401,
      code: 'UNAUTHORIZED',
      details: data,
    };
  }

  /**
   * Handle 403 Forbidden errors
   */
  private static handleForbiddenError(error: AxiosError, data: any): ApiError {
    return {
      message: data?.detail || 'Access denied',
      status: 403,
      code: 'FORBIDDEN',
      details: data,
    };
  }

  /**
   * Handle 422 Validation errors
   */
  private static handleValidationError(error: AxiosError, data: any): ApiError {
    const message = data?.detail || 'Validation error';
    return {
      message,
      status: 422,
      code: 'VALIDATION_ERROR',
      details: data,
    };
  }

  /**
   * Handle 5xx Server errors
   */
  private static handleServerError(error: AxiosError, data: any): ApiError {
    return {
      message: 'Server error occurred. Please try again later.',
      status: error.response?.status,
      code: 'SERVER_ERROR',
      details: data,
    };
  }

  /**
   * Handle network errors
   */
  private static handleNetworkError(error: AxiosError): ApiError {
    return {
      message: 'Network error. Please check your connection and try again.',
      code: 'NETWORK_ERROR',
    };
  }

  /**
   * Check if error is authentication-related
   */
  static isAuthError(error: ApiError): boolean {
    return error.status === 401 || error.code === 'UNAUTHORIZED';
  }

  /**
   * Check if error is permission-related
   */
  static isPermissionError(error: ApiError): boolean {
    return error.status === 403 || error.code === 'FORBIDDEN';
  }

  /**
   * Check if error is network-related
   */
  static isNetworkError(error: ApiError): boolean {
    return error.code === 'NETWORK_ERROR';
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: ApiError): boolean {
    return (
      error.status === 500 || // Internal server error
      error.status === 502 || // Bad gateway
      error.status === 503 || // Service unavailable
      error.status === 504 || // Gateway timeout
      this.isNetworkError(error) // Network errors
    );
  }
}

/**
 * React hook for handling API errors in components
 */
export function useApiErrorHandler() {
  const { logout } = useAuthStore();

  const handleError = (error: AxiosError | Error) => {
    const apiError = ApiErrorHandler.handleError(error);

    // Log error for debugging
    console.error('API Error:', apiError);

    return apiError;
  };

  const handleErrorWithToast = (error: AxiosError | Error) => {
    const apiError = handleError(error);

    // Here you could integrate with a toast notification system
    // For now, we'll just log it
    console.error('API Error:', apiError.message);

    return apiError;
  };

  return {
    handleError,
    handleErrorWithToast,
    logout,
  };
}

/**
 * Higher-order function to wrap API calls with error handling
 */
export function withErrorHandling<T extends any[], R>(
  apiCall: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await apiCall(...args);
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error as AxiosError);
      throw apiError;
    }
  };
}

/**
 * Utility to create user-friendly error messages
 */
export function getErrorMessage(error: ApiError): string {
  switch (error.code) {
    case 'UNAUTHORIZED':
      return 'Your session has expired. Please sign in again.';
    case 'FORBIDDEN':
      return 'You don\'t have permission to perform this action.';
    case 'NETWORK_ERROR':
      return 'Unable to connect. Please check your internet connection.';
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again.';
    case 'SERVER_ERROR':
      return 'Something went wrong on our end. Please try again later.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
}
