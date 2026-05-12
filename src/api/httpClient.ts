import axios from 'axios';
import type { AxiosError } from 'axios';
import { notify } from '../notifications/notifyService';

const baseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'https://localhost:7289/api';

const humanizeStatus = (status: number) => {
  if (status === 400) return { title: 'Invalid Request', severity: 'warning' as const };
  if (status === 401) return { title: 'Session Expired', severity: 'security' as const };
  if (status === 403) return { title: 'Access Denied', severity: 'security' as const };
  if (status === 404) return { title: 'Not Found', severity: 'warning' as const };
  if (status >= 500) return { title: 'Server Error', severity: 'error' as const };
  return { title: 'Request Failed', severity: 'error' as const };
};

const extractMessage = (error: AxiosError) => {
  const data = error.response?.data as
    | { message?: string; title?: string; errors?: unknown }
    | string
    | null
    | undefined;

  if (typeof data === 'string' && data.trim().length > 0) return data;
  if (data && typeof data === 'object') {
    if (typeof data.message === 'string' && data.message.trim().length > 0) return data.message;
    if (typeof data.title === 'string' && data.title.trim().length > 0) return data.title;
  }

  return error.message || 'Something went wrong. Please try again.';
};

export const httpClient = axios.create({
  baseURL: baseUrl,
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    if (status && status >= 400 && status < 600) {
      const meta = humanizeStatus(status);
      const message = extractMessage(error);
      const persist = status >= 500 || status === 401;

      notify({
        severity: meta.severity,
        title: meta.title,
        message,
        persist,
      });
    }

    return Promise.reject(error);
  }
);

