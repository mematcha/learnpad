/**
 * Entity types based on data-model.md
 */

export interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
}

export type NotebookStatus = 'generating' | 'completed' | 'failed';

export interface Notebook {
  notebook_id: string;
  user_id: string;
  title: string;
  subject: string;
  status: NotebookStatus;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  is_shared: boolean;
  share_token?: string;
}

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[]; // Only for directories
  size?: number; // Only for files, in bytes
  modified_at?: string; // ISO 8601, only for files
}

export interface FileTree {
  root: FileNode;
  notebook_id: string;
}

export interface NotebookContent {
  notebook_id: string;
  file_path: string;
  content: string;
  content_type: 'markdown' | 'text' | 'code';
  last_modified: string; // ISO 8601
}

export interface UserSettings {
  user_id: string;
  theme?: 'dark' | 'light' | 'system';
  notifications_enabled?: boolean;
  updated_at: string; // ISO 8601
}

export interface NotebookSettings {
  notebook_id: string;
  is_shared: boolean;
  share_token?: string;
  allow_comments?: boolean;
  updated_at: string; // ISO 8601
}

