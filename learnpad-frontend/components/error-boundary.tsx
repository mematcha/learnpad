'use client';

/**
 * Error boundary component for route-level error handling
 */

import { Component, type ReactNode } from 'react';
import { ErrorMessage } from './ui/error-message';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-primary px-4">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold mb-1 text-primary">
              Something went wrong
            </h2>
            <ErrorMessage
              message={
                this.state.error?.message ||
                'An unexpected error occurred. Please try refreshing the page.'
              }
            />
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="mt-lg px-4 py-2 bg-text-primary text-bg-primary rounded-md font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-2 min-h-[44px]"
              aria-label="Reload page"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

