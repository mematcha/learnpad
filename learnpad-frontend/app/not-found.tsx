/**
 * 404 Error page - displays when users access non-existent routes or resources
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-3 text-primary">404</h1>
        <h2 className="text-xl font-semibold mb-1 text-primary">
          Page Not Found
        </h2>
        <p className="text-sm text-secondary mb-4">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-4 py-2 bg-text-primary text-bg-primary rounded-md font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-2 min-h-[44px] flex items-center justify-center"
            aria-label="Go to homepage"
          >
            Go Home
          </Link>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 border border-color rounded-md font-medium hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-2 min-h-[44px]"
            aria-label="Go back to previous page"
          >
            Go Back
          </button>
        </div>
      </div>
    </main>
  );
}

