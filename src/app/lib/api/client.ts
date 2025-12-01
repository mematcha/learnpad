/**
 * API Client
 * Axios client with JWT token interceptors for authentication
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '@/lib/stores/auth-store';
import { LoginResponse, GoogleTokenRequest } from '@/lib/types/auth';

// Environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token refresh and auth errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        await useAuthStore.getState().refreshToken();

        // Get the new token
        const newToken = useAuthStore.getState().token;

        if (newToken && originalRequest.headers) {
          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Retry the original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, logout the user
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    // If still getting 401 after refresh attempt, logout
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  }
);

// Authentication API methods
export const authAPI = {
  /**
   * Authenticate with Google ID token
   */
  loginWithGoogle: async (token: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/google', {
      token,
    } as GoogleTokenRequest);
    return response.data;
  },

  /**
   * Verify current JWT token
   */
  verifyToken: async (): Promise<{ valid: boolean; user: any }> => {
    const response = await apiClient.post('/auth/verify');
    return response.data;
  },

  /**
   * Refresh JWT token
   */
  refreshToken: async (): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/refresh');
    return response.data;
  },
};

// Notebook API methods (examples)
export const notebookAPI = {
  /**
   * List notebooks for the authenticated user
   */
  listNotebooks: async (params?: {
    status?: string;
    subject?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await apiClient.get('/api/notebooks', { params });
    return response.data;
  },

  /**
   * Get notebook details
   */
  getNotebook: async (notebookId: string) => {
    const response = await apiClient.get(`/api/notebooks/${notebookId}`);
    return response.data;
  },

  /**
   * Create a new notebook
   */
  createNotebook: async (data: {
    plan_id?: string;
    config?: any;
    user_id: string;
    options?: {
      include_progress_tracking?: boolean;
      include_cross_references?: boolean;
      output_format?: string;
    };
  }) => {
    const response = await apiClient.post('/api/notebooks/generate', data);
    return response.data;
  },

  /**
   * Get notebook status/progress
   */
  getNotebookStatus: async (notebookId: string) => {
    const response = await apiClient.get(`/api/notebooks/${notebookId}`);
    return response.data;
  },

  /**
   * Get notebook file tree
   */
  getNotebookTree: async (notebookId: string) => {
    const response = await apiClient.get(`/api/notebooks/${notebookId}/tree`);
    return response.data;
  },

  /**
   * List notebook files
   */
  listNotebookFiles: async (notebookId: string, prefix?: string) => {
    const response = await apiClient.get(`/api/notebooks/${notebookId}/files`, {
      params: { prefix },
    });
    return response.data;
  },

  /**
   * Get notebook file content
   */
  getNotebookFile: async (notebookId: string, filePath: string) => {
    const response = await apiClient.get(`/api/notebooks/${notebookId}/file`, {
      params: { file_path: filePath },
    });
    return response.data;
  },
};

// Assessment API methods
export const assessmentAPI = {
  /**
   * Start assessment session
   */
  startAssessment: async (data: {
    subject?: string;
    initial_goals?: string;
    user_id: string;
  }) => {
    const response = await apiClient.post('/api/notebooks/assess/start', data);
    return response.data;
  },

  /**
   * Send message in assessment session
   */
  sendAssessmentMessage: async (sessionId: string, data: {
    message: string;
    user_id: string;
  }) => {
    const response = await apiClient.post(`/api/notebooks/assess/${sessionId}/message`, data);
    return response.data;
  },

  /**
   * Get assessment profile
   */
  getAssessmentProfile: async (sessionId: string) => {
    const response = await apiClient.get(`/api/notebooks/assess/${sessionId}/profile`);
    return response.data;
  },
};

// Curriculum API methods
export const curriculumAPI = {
  /**
   * Create curriculum plan
   */
  createCurriculumPlan: async (data: {
    user_profile: any;
    subject: string;
    learning_goals?: string;
    time_constraints?: string;
  }) => {
    const response = await apiClient.post('/api/notebooks/plan', data);
    return response.data;
  },

  /**
   * Get curriculum plan
   */
  getCurriculumPlan: async (planId: string) => {
    const response = await apiClient.get(`/api/notebooks/plan/${planId}`);
    return response.data;
  },
};

// Export the axios instance for direct use if needed
export { apiClient };

// Export a typed API object
export const api = {
  auth: authAPI,
  notebooks: notebookAPI,
  assessments: assessmentAPI,
  curriculum: curriculumAPI,
};
