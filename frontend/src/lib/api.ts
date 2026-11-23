import axios, { type InternalAxiosRequestConfig } from 'axios';
import { clearAuthTokens, getAccessToken, getCsrfToken } from '../features/auth/auth-store';

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

export type AuthRefreshHandler = () => Promise<boolean>;

let authRefreshHandler: AuthRefreshHandler | null = null;

export function registerAuthRefreshHandler(handler: AuthRefreshHandler | null): void {
  authRefreshHandler = handler;
}

type RetriableRequestConfig = InternalAxiosRequestConfig & { _authRetried?: boolean };

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const row = document.cookie.split('; ').find((entry) => entry.startsWith(`${name}=`));
  return row ? decodeURIComponent(row.slice(name.length + 1)) : null;
}

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const csrfToken = getCsrfToken() ?? readCookie('csrf_token');
  if (csrfToken) {
    config.headers.set('X-CSRF-Token', csrfToken);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }

    const config = error.config as RetriableRequestConfig;
    const status = error.response?.status;
    const url = config.url ?? '';
    const isAuthEndpoint = url.includes('/auth/');

    if (status !== 401 || config._authRetried || isAuthEndpoint || !authRefreshHandler) {
      return Promise.reject(error);
    }

    config._authRetried = true;

    try {
      const refreshed = await authRefreshHandler();
      if (refreshed) {
        return apiClient.request(config);
      }
    } catch {
      clearAuthTokens();
      return Promise.reject(error);
    }

    clearAuthTokens();
    return Promise.reject(error);
  },
);
