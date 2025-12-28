/**
 * API client base with fetch wrapper, error handling, and cookie support
 */

import { API_URL } from '@/lib/constants';
import type { ApiError, ErrorResponse } from '@/types/errors';
import { ApiException } from '@/types/errors';

export interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Base API request function with error handling and cookie support
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;

  // Ensure URL is properly formatted
  let url: string;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    url = endpoint;
  } else {
    // Ensure API_URL ends with / and endpoint doesn't start with /
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    url = `${baseUrl}${path}`;
  }

  // Validate URL format
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error(`Invalid API URL: ${url}. URL must start with http:// or https://`);
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Include cookies for httpOnly token
  });

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    if (!response.ok) {
      throw new ApiException(
        {
          error: 'Request failed',
          message: `HTTP ${response.status}: ${response.statusText}`,
        },
        response.status
      );
    }
    return response as unknown as T;
  }

  const data = await response.json();

  if (!response.ok) {
    const error = data as ErrorResponse;
    throw new ApiException(error, response.status);
  }

  return data as T;
}

/**
 * GET request helper
 */
export function get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'GET',
  });
}

/**
 * POST request helper
 */
export function post<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request helper
 */
export function put<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request helper
 */
export function del<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'DELETE',
  });
}

