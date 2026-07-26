/**
 * Auth service — all authentication API calls in one place.
 */
import { apiClient, TOKEN_KEY } from '@/lib/apiClient';
import type { AuthResponse, LoginCredentials, User } from '@/types';

export const authService = {
  /**
   * Authenticate and store the returned JWT in localStorage.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    return data;
  },

  /**
   * Fetch the currently authenticated user's profile.
   */
  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },

  /**
   * Remove the stored JWT. Note: backend token remains valid until expiry.
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Check if a token is present in localStorage.
   * Does not validate the token's expiry — that is handled by the API.
   */
  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },
};
