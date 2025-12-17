/**
 * Authentication utilities for verifying auth state and handling tokens
 */

import type { User } from '@/types/entities';
import { verifyToken } from '@/lib/api/auth';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Verify authentication state by checking token
 */
export async function verifyAuthState(): Promise<User | null> {
  try {
    const response = await verifyToken();
    if (response.valid && response.user_info) {
      return response.user_info;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get user from token (for Server Components)
 * This reads the httpOnly cookie automatically via fetch
 */
export async function getUserFromToken(): Promise<User | null> {
  return verifyAuthState();
}

/**
 * Check if token is expired based on error response
 */
export function isTokenExpired(error: unknown): boolean {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    return error.statusCode === 401;
  }
  return false;
}

/**
 * Handle token expiration - redirect to login
 */
export function handleTokenExpiration(): void {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

