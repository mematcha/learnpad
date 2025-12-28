/**
 * User API functions
 */

import { get, put } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type {
  UserProfileResponse,
  UserProfileUpdate,
  UserProfileUpdateResponse,
} from '@/types/api';

/**
 * Get current user's profile information
 */
export async function getProfile(): Promise<UserProfileResponse> {
  return get<UserProfileResponse>(API_ENDPOINTS.USER.PROFILE);
}

/**
 * Update user profile settings
 */
export async function updateProfile(
  updates: UserProfileUpdate
): Promise<UserProfileUpdateResponse> {
  return put<UserProfileUpdateResponse>(API_ENDPOINTS.USER.PROFILE, updates);
}

