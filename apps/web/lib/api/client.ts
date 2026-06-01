/**
 * API Client Layer
 * Generic HTTP client functions with authentication and error handling
 */

import { getAccessToken, clearTokens } from '../auth/storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Custom API error class with status code and optional error code
 */
export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Get authorization headers with Bearer token
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Handle API response - parse JSON and handle errors
 * Automatically redirects to /login on 401 Unauthorized
 */
export async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError('認証が必要です', 401, 'UNAUTHORIZED');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    let errorMessage = 'エラーが発生しました';
    let errorCode = 'UNKNOWN_ERROR';

    if (data.detail) {
      if (Array.isArray(data.detail)) {
        errorMessage = data.detail
          .map((err: { loc?: string[]; msg?: string }) => {
            const field = err.loc?.slice(-1)[0] || 'field';
            return `${field}: ${err.msg || 'invalid'}`;
          })
          .join(', ');
        errorCode = 'VALIDATION_ERROR';
      } else {
        errorMessage = data.detail;
      }
    }
    if (data.code) {
      errorCode = data.code;
    }

    throw new ApiError(errorMessage, response.status, errorCode);
  }

  return response.json();
}

/**
 * Generic GET request
 */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse<T>(response);
}

/**
 * Generic POST request
 */
export async function apiPost<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
  return handleResponse<T>(response);
}

/**
 * Generic PUT request
 */
export async function apiPut<T>(path: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<T>(response);
}

/**
 * Generic PATCH request
 */
export async function apiPatch<T>(path: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<T>(response);
}

/**
 * Generic DELETE request
 */
export async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse<void>(response);
}
