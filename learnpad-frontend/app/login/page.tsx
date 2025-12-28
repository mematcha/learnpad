'use client';

/**
 * Login page with Google OAuth authentication
 * Uses Google's button rendering to avoid FedCM issues
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { loginGoogle } from '@/lib/api/auth';
import { LoadingSpinner } from '@/components/ui/loading';
import { GOOGLE_CLIENT_ID } from '@/lib/constants';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              width?: string | number;
              type?: 'standard' | 'icon';
            }
          ) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('Received Google credential, sending to backend...');
        // Exchange Google ID token with backend
        const result = await loginGoogle(response.credential);
        console.log('Authentication successful:', result);

        // Backend sets httpOnly cookie, redirect to home
        router.push('/');
        router.refresh();
      } catch (err) {
        console.error('Authentication error:', err);
        const errorMessage = err instanceof Error
          ? err.message
          : 'Authentication failed. Please try again.';
        setError(errorMessage);
        setIsLoading(false);
      }
    },
    [router]
  );

  // Initialize Google Sign-In and render button
  useEffect(() => {
    // Validate client ID before initializing
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID is not configured. Please check your environment variables.');
      return;
    }

    if (!buttonRef.current || isInitialized) {
      return;
    }

    const initGoogleSignIn = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id && buttonRef.current) {
        try {
          // Initialize Google Identity Services
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
          });

          // Render the button (this avoids FedCM)
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: '100%',
            type: 'standard',
          });

          setIsInitialized(true);
        } catch (err) {
          console.error('Google Sign-In initialization error:', err);
          setError('Failed to initialize Google Sign-In. Please refresh the page.');
        }
      }
    };

    // Wait for Google script to load
    if (typeof window !== 'undefined') {
      if (window.google?.accounts?.id) {
        initGoogleSignIn();
      } else {
        // Wait for script to load
        const checkGoogle = setInterval(() => {
          if (window.google?.accounts?.id) {
            initGoogleSignIn();
            clearInterval(checkGoogle);
          }
        }, 100);

        // Cleanup after 5 seconds
        setTimeout(() => clearInterval(checkGoogle), 5000);
      }
    }

    // Cleanup function
    return () => {
      // Clear any intervals if component unmounts
    };
  }, [handleCredentialResponse, isInitialized]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold mb-1 text-primary">
            Welcome to LearnPad
          </h1>
          <p className="text-sm text-secondary">
            Sign in to access your personalized learning notebooks
          </p>
        </div>

        <div className="bg-secondary border border-color rounded-md p-4">
          {error && (
            <div
              className="mb-3 p-3 bg-red-900/20 border border-red-500/50 rounded-md text-sm text-red-400"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          {isLoading && (
            <div className="mb-3 flex items-center justify-center">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-secondary">Signing in...</span>
            </div>
          )}

          {/* Google Sign-In button will be rendered here */}
          <div ref={buttonRef} className="w-full" />
        </div>
      </div>
    </main>
  );
}

