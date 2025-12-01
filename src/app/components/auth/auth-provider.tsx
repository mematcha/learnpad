/**
 * Auth Provider
 * Provides Google OAuth context and initializes authentication state
 */

'use client';

import React, { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from '@/lib/stores/auth-store';

interface AuthProviderProps {
  children: React.ReactNode;
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function AuthProvider({ children }: AuthProviderProps) {
  const { verifyToken } = useAuthStore();

  // Initialize authentication state on mount
  useEffect(() => {
    // Verify token on app start (handled by Zustand persist middleware)
    // The store will automatically verify tokens on rehydration
  }, []);

  // If Google Client ID is not configured, show error
  if (!GOOGLE_CLIENT_ID) {
    console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is not set');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Configuration Error
          </h2>
          <p className="text-gray-600">
            Google OAuth client ID is not configured. Please check your environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}

// Hook to get authentication status
export function useAuth() {
  const {
    isAuthenticated,
    user,
    token,
    tokenData,
    isLoading,
    error,
    login,
    logout,
    refreshToken,
    verifyToken: verify,
    setError,
    setLoading,
  } = useAuthStore();

  return {
    isAuthenticated,
    user,
    token,
    tokenData,
    isLoading,
    error,
    login,
    logout,
    refreshToken,
    verifyToken: verify,
    setError,
    setLoading,
  };
}
