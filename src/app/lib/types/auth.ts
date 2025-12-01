/**
 * Authentication Types
 * Types for Google OAuth and JWT authentication matching backend models
 */

export interface User {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

export interface TokenData {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  exp: Date;
  iat: Date;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_info: User;
}

export interface GoogleTokenRequest {
  token: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  tokenData: TokenData | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (googleToken: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  verifyToken: () => Promise<boolean>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}
