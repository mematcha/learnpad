/**
 * Login Button Component
 * Google Sign-In button using @react-oauth/google
 */

'use client';

import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from './auth-provider';

interface LoginButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function LoginButton({
  variant = 'default',
  size = 'default',
  className,
  children = 'Sign in with Google',
  onSuccess,
  onError,
}: LoginButtonProps) {
  const { login, isLoading, error, setError } = useAuth();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setError(null);

      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }

      await login(credentialResponse.credential);

      // Call optional success callback
      onSuccess?.();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleGoogleError = () => {
    const errorMessage = 'Google sign-in failed';
    setError(errorMessage);
    onError?.(errorMessage);
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        theme="outline"
        size="large"
        text="signin_with"
        shape="rectangular"
        width="250"
        logo_alignment="left"
      />

      {isLoading && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Signing in...</span>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 text-center max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
}

// Alternative button-style login component (if Google button doesn't fit design)
export function LoginButtonAlt({
  variant = 'default',
  size = 'default',
  className,
  children = 'Sign in with Google',
  onSuccess,
  onError,
}: LoginButtonProps) {
  const { login, isLoading, error, setError } = useAuth();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setError(null);

      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }

      await login(credentialResponse.credential);

      // Call optional success callback
      onSuccess?.();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleGoogleError = () => {
    const errorMessage = 'Google sign-in failed';
    setError(errorMessage);
    onError?.(errorMessage);
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={isLoading}
        onClick={() => {
          // This would need to be implemented differently for a custom button
          // For now, we'll use the GoogleLogin component but hide it
          const googleLoginButton = document.querySelector('[data-testid="google-login-button"]') as HTMLElement;
          if (googleLoginButton) {
            googleLoginButton.click();
          }
        }}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Button>

      {/* Hidden Google Login component */}
      <div className="hidden">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 text-center max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
}
