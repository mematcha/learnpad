/**
 * Protected Route Component
 * Wrapper component that protects routes requiring authentication
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from './auth-provider';
import { LoginButton } from './login-button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
  requireAuth?: boolean; // Default true, set to false for optional auth
}

/**
 * ProtectedRoute component that requires authentication to access children
 * Shows login button if not authenticated, or redirects to login page
 */
export function ProtectedRoute({
  children,
  redirectTo = '/login',
  fallback,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, verifyToken } = useAuth();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (isAuthenticated) {
        // Verify token validity
        const isValid = await verifyToken();
        if (!isValid && requireAuth) {
          router.push(redirectTo);
        }
      }
      setIsVerifying(false);
    };

    verifyAuth();
  }, [isAuthenticated, verifyToken, requireAuth, redirectTo, router]);

  // Show loading state while verifying authentication
  if (isLoading || isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // If authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Show custom fallback or redirect
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default fallback: show login prompt
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-4">
            Please sign in with Google to access this feature.
          </p>
        </div>
        <LoginButton />
      </div>
    );
  }

  // User is authenticated or auth is not required
  return <>{children}</>;
}

/**
 * OptionalAuthRoute component that doesn't require authentication
 * Useful for pages that work better when authenticated but don't require it
 */
export function OptionalAuthRoute({
  children,
  fallback,
}: Omit<ProtectedRouteProps, 'requireAuth'>) {
  return (
    <ProtectedRoute requireAuth={false} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Hook to check authentication status with loading state
 */
export function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    setIsVerifying(false);
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    isLoading: isLoading || isVerifying,
    isReady: !isLoading && !isVerifying,
  };
}
