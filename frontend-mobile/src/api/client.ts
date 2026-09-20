/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/features/auth/stores/authStore';
import router from '@/router';
import { ApiException, type ApiError } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore();
    const token = await authStore.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[API Request Error]', error);
    }
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(
        `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
          data: response.data,
        }
      );
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // Safe extraction of readable messages (e.g. NestJS ValidationPipe array of strings)
      let message = 'Error desconocido';
      if (Array.isArray(data?.message)) {
        message = data.message.join(', ');
      } else if (typeof data?.message === 'string' && data.message.trim().length > 0) {
        message = data.message;
      } else if (error.message) {
        message = error.message;
      }

      const errors =
        data?.errors ||
        (Array.isArray(data?.message) ? data.message : undefined);

      const apiException = new ApiException(message, status, errors);

      if (status === 401) {
        const authStore = useAuthStore();
        await authStore.logout();

        if (
          router.currentRoute.value?.name !== 'login' &&
          router.currentRoute.value?.path !== '/login'
        ) {
          await router.push('/login');
        }
      }

      if (status === 404) {
        console.debug('[API 404]', {
          url: error.config?.url,
          method: error.config?.method,
          message: apiException.message,
        });
      } else {
        console.error('[API Error]', {
          url: error.config?.url,
          method: error.config?.method,
          status,
          message: apiException.message,
          errors: apiException.errors,
        });
      }

      return Promise.reject(apiException);
    } else if (error.request) {
      const apiException = new ApiException(
        'No se pudo conectar con el servidor',
        0
      );
      console.error('[API Network Error]', error.request);
      return Promise.reject(apiException);
    } else {
      const apiException = new ApiException(
        error.message || 'Error al procesar la petición',
        0
      );
      console.error('[API Config Error]', error);
      return Promise.reject(apiException);
    }
  }
);

export default apiClient;
