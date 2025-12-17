/**
 * Constants for LearnPad frontend
 */

  // Get API URL from environment, ensuring it has proper protocol
  let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Fix common issues: add protocol if missing, remove quotes
apiUrl = apiUrl.trim().replace(/^['"]|['"]$/g, ''); // Remove quotes
if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
  // If it's just a hostname, add http://
  apiUrl = `http://${apiUrl}`;
}

export const API_URL = apiUrl;

// Validate API_URL format
if (typeof window !== 'undefined' && API_URL && !API_URL.startsWith('http')) {
  console.error('API_URL must start with http:// or https://', { API_URL });
}

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

if (!GOOGLE_CLIENT_ID && typeof window !== 'undefined') {
  console.warn('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Google Sign-In will not work.');
}

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE: '/auth/google',
    VERIFY: '/auth/verify',
  },
  NOTEBOOKS: {
    LIST: '/api/notebooks',
    DETAIL: (id: string) => `/api/notebooks/${id}`,
    TREE: (id: string) => `/api/notebooks/${id}/tree`,
    FILE: (id: string, filePath: string) => `/api/notebooks/${id}/files/${encodeURIComponent(filePath)}`,
    SETTINGS: (id: string) => `/api/notebooks/${id}/settings`,
    DELETE: (id: string) => `/api/notebooks/${id}`,
  },
  USER: {
    PROFILE: '/api/user/profile',
  },
} as const;

// Breakpoints (matching constitution P9)
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 1024,
} as const;

// Touch target minimum size (matching constitution P9)
export const TOUCH_TARGET_MIN_SIZE = 44; // pixels

