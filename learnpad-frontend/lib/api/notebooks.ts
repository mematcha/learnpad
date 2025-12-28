/**
 * Notebooks API functions
 */

import { get, put, del } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type {
  NotebookListQuery,
  NotebookListResponse,
  NotebookDetailResponse,
  NotebookFileResponse,
  NotebookSettingsUpdate,
  NotebookSettingsResponse,
  NotebookDeleteResponse,
} from '@/types/api';

/**
 * List user's notebooks
 */
export async function listNotebooks(
  query?: NotebookListQuery
): Promise<NotebookListResponse> {
  const params = new URLSearchParams();
  if (query?.page) params.append('page', query.page.toString());
  if (query?.page_size) params.append('page_size', query.page_size.toString());
  if (query?.status) params.append('status', query.status);

  const endpoint = `${API_ENDPOINTS.NOTEBOOKS.LIST}?${params.toString()}`;
  return get<NotebookListResponse>(endpoint);
}

/**
 * Get notebook details and file tree
 */
export async function getNotebook(
  notebookId: string
): Promise<NotebookDetailResponse> {
  return get<NotebookDetailResponse>(API_ENDPOINTS.NOTEBOOKS.DETAIL(notebookId));
}

/**
 * Get notebook file tree structure
 */
export async function getNotebookTree(
  notebookId: string
): Promise<{ file_tree: { root: import('@/types/entities').FileNode } }> {
  return get<{ file_tree: { root: import('@/types/entities').FileNode } }>(
    API_ENDPOINTS.NOTEBOOKS.TREE(notebookId)
  );
}

/**
 * Get content of a specific file in the notebook
 */
export async function getNotebookFile(
  notebookId: string,
  filePath: string
): Promise<NotebookFileResponse> {
  return get<NotebookFileResponse>(
    API_ENDPOINTS.NOTEBOOKS.FILE(notebookId, filePath)
  );
}

/**
 * Update notebook settings
 */
export async function updateNotebookSettings(
  notebookId: string,
  settings: NotebookSettingsUpdate
): Promise<NotebookSettingsResponse> {
  return put<NotebookSettingsResponse>(
    API_ENDPOINTS.NOTEBOOKS.SETTINGS(notebookId),
    settings
  );
}

/**
 * Delete a notebook
 */
export async function deleteNotebook(
  notebookId: string
): Promise<NotebookDeleteResponse> {
  return del<NotebookDeleteResponse>(API_ENDPOINTS.NOTEBOOKS.DELETE(notebookId));
}

