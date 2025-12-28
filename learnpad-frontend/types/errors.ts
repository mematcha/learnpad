/**
 * Error types for LearnPad frontend
 */

export interface ApiError {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export class ApiException extends Error {
  constructor(
    public error: ApiError,
    public statusCode?: number
  ) {
    super(error.message);
    this.name = 'ApiException';
  }
}

export interface ValidationError {
  field: string;
  error: string;
}

export interface FormErrors {
  [field: string]: string;
}

