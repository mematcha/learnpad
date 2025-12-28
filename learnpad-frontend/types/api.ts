/**
 * API response types based on contracts/api-contracts.md
 */

import type { User, Notebook, FileTree, NotebookContent } from './entities';

// Authentication API
export interface GoogleLoginRequest {
  token: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  user_info: User;
}

export interface VerifyTokenResponse {
  valid: boolean;
  user_info: User;
}

// Notebooks API
export interface NotebookListQuery {
  page?: number;
  page_size?: number;
  status?: 'generating' | 'completed' | 'failed';
}

export interface NotebookListResponse {
  notebooks: Notebook[];
  total: number;
  page: number;
  page_size: number;
}

export interface NotebookDetailResponse {
  notebook: Notebook;
  file_tree: FileTree;
  can_edit: boolean;
  can_view: boolean;
}

export interface NotebookFileResponse {
  content: string;
  content_type: 'markdown' | 'text' | 'code';
  file_path: string;
  last_modified: string;
}

export interface NotebookSettingsUpdate {
  title?: string;
  subject?: string;
  is_shared?: boolean;
  allow_comments?: boolean;
}

export interface NotebookSettingsResponse {
  notebook: Notebook;
  message: string;
}

export interface NotebookDeleteResponse {
  message: string;
  deleted_at: string;
}

// User API
export interface UserProfileResponse {
  user: User;
  settings?: {
    theme: 'dark' | 'light' | 'system';
    notifications_enabled: boolean;
  };
}

export interface UserProfileUpdate {
  theme?: 'dark' | 'light' | 'system';
  notifications_enabled?: boolean;
}

export interface UserProfileUpdateResponse {
  user: User;
  settings: {
    theme: 'dark' | 'light' | 'system';
    notifications_enabled: boolean;
  };
  message: string;
}

// Error Response
export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

