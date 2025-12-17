/**
 * Server-side authentication utilities for Server Components
 */

import { cookies } from 'next/headers';
import { API_URL } from '@/lib/constants';
import type { User } from '@/types/entities';
import type { VerifyTokenResponse } from '@/types/api';

/**
 * Get authenticated user in Server Component
 * Reads httpOnly cookie and verifies token with backend
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token');

    if (!token) {
      return null;
    }

    // Verify token with backend using server-side fetch
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `access_token=${token.value}`, // Forward the cookie
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data: VerifyTokenResponse = await response.json();
    if (data.valid && data.user_info) {
      return data.user_info;
    }

    return null;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Check if user is authenticated in Server Component
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getServerUser();
  return !!user;
}

