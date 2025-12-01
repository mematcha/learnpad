/**
 * Authentication Store
 * Zustand store for managing authentication state and JWT tokens
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import { User, TokenData, LoginResponse, AuthState, AuthActions } from '@/lib/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001';

// Token storage keys
const TOKEN_KEY = 'learnpad_auth_token';
const USER_KEY = 'learnpad_user';

interface AuthStore extends AuthState, AuthActions {
  // Internal state for token refresh
  refreshPromise: Promise<void> | null;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      token: null,
      tokenData: null,
      isLoading: false,
      error: null,
      refreshPromise: null,

      // Actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: string | null) => set({ error }),

      login: async (googleToken: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/google`, {
            token: googleToken,
          });

          const { access_token, user_info, expires_in } = response.data;

          // Parse token to get token data
          const tokenData = parseJwtToken(access_token);

          set({
            isAuthenticated: true,
            user: user_info,
            token: access_token,
            tokenData,
            isLoading: false,
            error: null,
          });

          // Set up automatic token refresh (refresh 5 minutes before expiry)
          const refreshTime = (expires_in - 300) * 1000; // Convert to milliseconds, subtract 5 minutes
          setTimeout(() => {
            get().refreshToken();
          }, refreshTime);

        } catch (error) {
          const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.detail || 'Login failed'
            : 'An unexpected error occurred';

          set({
            isAuthenticated: false,
            user: null,
            token: null,
            tokenData: null,
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          tokenData: null,
          error: null,
        });
      },

      refreshToken: async () => {
        const { token, refreshPromise } = get();

        // If refresh is already in progress, return the existing promise
        if (refreshPromise) {
          return refreshPromise;
        }

        // Only refresh if we have a token
        if (!token) {
          return;
        }

        const promise = (async () => {
          try {
            set({ error: null });

            const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/refresh`, {}, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            const { access_token, user_info, expires_in } = response.data;
            const tokenData = parseJwtToken(access_token);

            set({
              token: access_token,
              tokenData,
              user: user_info, // Update user info in case it changed
              error: null,
            });

            // Set up next refresh
            const refreshTime = (expires_in - 300) * 1000;
            setTimeout(() => {
              get().refreshToken();
            }, refreshTime);

          } catch (error) {
            // If refresh fails, log out the user
            const errorMessage = axios.isAxiosError(error)
              ? error.response?.data?.detail || 'Token refresh failed'
              : 'Token refresh failed';

            set({
              isAuthenticated: false,
              user: null,
              token: null,
              tokenData: null,
              error: errorMessage,
            });

            throw error;
          } finally {
            set({ refreshPromise: null });
          }
        })();

        set({ refreshPromise: promise });
        return promise;
      },

      verifyToken: async (): Promise<boolean> => {
        const { token } = get();

        if (!token) {
          return false;
        }

        try {
          set({ error: null });

          const response = await axios.post(`${API_BASE_URL}/auth/verify`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = response.data;
          if (data.valid && data.user) {
            // Update token data from verification response
            const tokenData = parseJwtToken(token);
            set({
              tokenData,
              user: data.user,
              error: null,
            });
          }

          return data.valid;
        } catch (error) {
          // If verification fails, the token is invalid
          const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.detail || 'Token verification failed'
            : 'Token verification failed';

          set({
            isAuthenticated: false,
            user: null,
            token: null,
            tokenData: null,
            error: errorMessage,
          });

          return false;
        }
      },
    }),
    {
      name: 'learnpad-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        tokenData: state.tokenData,
      }),
      // On rehydrate, verify the token
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          // Verify token on app start
          setTimeout(() => {
            state.verifyToken();
          }, 100);
        }
      },
    }
  )
);

// Helper function to parse JWT token (without verification)
function parseJwtToken(token: string): TokenData {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,  // Include picture from token
      exp: new Date(payload.exp * 1000),
      iat: new Date(payload.iat * 1000),
    };
  } catch (error) {
    throw new Error('Invalid token format');
  }
}
