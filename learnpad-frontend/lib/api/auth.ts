/**
 * Authentication API functions
 */

import { post } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type {
  GoogleLoginRequest,
  AuthResponse,
  VerifyTokenResponse,
} from '@/types/api';

/**
 * Authenticate user with Google OAuth ID token
 */
export async function loginGoogle(
  token: string
): Promise<AuthResponse> {
  const request: GoogleLoginRequest = { token };
  return post<AuthResponse>(API_ENDPOINTS.AUTH.GOOGLE, request, {
    requireAuth: false,
  });
}

/**
 * Verify current authentication token
 */
export async function verifyToken(): Promise<VerifyTokenResponse> {
  return post<VerifyTokenResponse>(API_ENDPOINTS.AUTH.VERIFY);
}

