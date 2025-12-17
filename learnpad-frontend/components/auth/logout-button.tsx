'use client';

/**
 * Logout button component
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading';

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Call backend logout endpoint if it exists, or just clear client state
      // For now, redirect to login which will clear auth state
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if logout fails
      router.push('/login');
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-primary">
        Account Actions
      </h2>
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="px-4 py-2 border border-red-500/50 text-red-400 rounded-md font-medium hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
        aria-label="Sign out of your account"
        aria-busy={isLoggingOut}
      >
        {isLoggingOut ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Signing out...</span>
          </>
        ) : (
          'Sign Out'
        )}
      </button>
    </div>
  );
}

