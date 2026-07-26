/**
 * Centralised Axios client for MediClaim API.
 *
 * - Base URL from environment variable
 * - Attaches JWT Bearer token from localStorage on every request
 * - Handles 401 responses by clearing auth state and redirecting to login
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const TOKEN_KEY = 'mediclaim_access_token';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: Attach JWT ──────────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// ─── Response Interceptor: Handle 401 ────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login when session expires
      localStorage.removeItem(TOKEN_KEY);
      // Use window.location to avoid React Router import cycle
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Extract a user-friendly error message from an Axios error response.
 */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (data?.message) {
      return Array.isArray(data.message)
        ? data.message.join('. ')
        : data.message;
    }
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
