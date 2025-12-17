/**
 * Error boundary for authenticated homepage
 */

'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Homepage error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold mb-1 text-primary">
          Something went wrong
        </h2>
        <p className="text-sm text-secondary mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-text-primary text-bg-primary rounded-md font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-2 min-h-[44px]"
          aria-label="Try again"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

