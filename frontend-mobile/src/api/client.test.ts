/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { ApiException } from './types';

const { mockGetToken, mockLogout, mockPush, mockCurrentRoute } = vi.hoisted(() => ({
  mockGetToken: vi.fn(),
  mockLogout: vi.fn(),
  mockPush: vi.fn(),
  mockCurrentRoute: { value: { name: 'home', path: '/home' } },
}));

vi.mock('@/features/auth/stores/authStore', () => ({
  useAuthStore: () => ({
    getToken: mockGetToken,
    logout: mockLogout,
  }),
}));

vi.mock('@/router', () => ({
  default: {
    push: mockPush,
    get currentRoute() {
      return mockCurrentRoute;
    },
  },
}));

// Import apiClient after mocks are registered
import apiClient from './client';

describe('API Client Interceptors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentRoute.value = { name: 'home', path: '/home' };
  });

  describe('Request Interceptor', () => {
    // Retrieve the registered request interceptor handler
    const requestHandler = (apiClient.interceptors.request as any).handlers[0];

    it('should inject Authorization Bearer header when token is present', async () => {
      mockGetToken.mockResolvedValue('firebase-test-token-123');
      const config = {
        headers: {},
      } as InternalAxiosRequestConfig;

      const result = await requestHandler.fulfilled(config);

      expect(mockGetToken).toHaveBeenCalled();
      expect(result.headers.Authorization).toBe('Bearer firebase-test-token-123');
    });

    it('should not set Authorization header when token is null or empty', async () => {
      mockGetToken.mockResolvedValue(null);
      const config = {
        headers: {},
      } as InternalAxiosRequestConfig;

      const result = await requestHandler.fulfilled(config);

      expect(mockGetToken).toHaveBeenCalled();
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should reject when request interceptor encounters error', async () => {
      const error = new Error('Request error');
      await expect(requestHandler.rejected(error)).rejects.toThrow('Request error');
    });
  });

  describe('Response Interceptor', () => {
    // Retrieve the registered response interceptor handler
    const responseHandler = (apiClient.interceptors.response as any).handlers[0];

    it('should return response directly on success', () => {
      const mockResponse = {
        data: { ok: true },
        status: 200,
        config: { method: 'get', url: '/v2/test' },
      } as AxiosResponse;

      const result = responseHandler.fulfilled(mockResponse);
      expect(result).toBe(mockResponse);
    });

    it('should handle 401 Unauthorized: call logout and redirect to /login', async () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Token expired or invalid' },
        },
        config: { method: 'get', url: '/v2/members' },
      } as unknown as AxiosError;

      await expect(responseHandler.rejected(error)).rejects.toThrow(ApiException);
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should not trigger redundant redirect if current route is already login', async () => {
      mockCurrentRoute.value = { name: 'login', path: '/login' };

      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
        config: { method: 'get', url: '/v2/members' },
      } as unknown as AxiosError;

      await expect(responseHandler.rejected(error)).rejects.toThrow(ApiException);
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should format 400 Bad Request with validation error array into legible message and errors array', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            statusCode: 400,
            message: ['email must be an email', 'name should not be empty'],
            error: 'Bad Request',
          },
        },
        config: { method: 'post', url: '/v2/members' },
      } as unknown as AxiosError;

      try {
        await responseHandler.rejected(error);
        expect.fail('Should have thrown ApiException');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiException);
        const apiException = err as ApiException;
        expect(apiException.status).toBe(400);
        expect(apiException.message).toBe('email must be an email, name should not be empty');
        expect(apiException.errors).toEqual([
          'email must be an email',
          'name should not be empty',
        ]);
      }
    });

    it('should format 400 Bad Request with string message and field errors object', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Validation failed',
            errors: {
              email: ['Invalid format'],
            },
          },
        },
        config: { method: 'post', url: '/v2/members' },
      } as unknown as AxiosError;

      try {
        await responseHandler.rejected(error);
        expect.fail('Should have thrown ApiException');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiException);
        const apiException = err as ApiException;
        expect(apiException.status).toBe(400);
        expect(apiException.message).toBe('Validation failed');
        expect(apiException.errors).toEqual({
          email: ['Invalid format'],
        });
      }
    });

    it('should transform network errors (error.request without response) into ApiException with status 0', async () => {
      const error = {
        request: {},
        message: 'Network Error',
      } as unknown as AxiosError;

      try {
        await responseHandler.rejected(error);
        expect.fail('Should have thrown ApiException');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiException);
        const apiException = err as ApiException;
        expect(apiException.status).toBe(0);
        expect(apiException.message).toBe('No se pudo conectar con el servidor');
      }
    });

    it('should transform generic setup errors into ApiException with status 0', async () => {
      const error = {
        message: 'Request configuration error',
      } as unknown as AxiosError;

      try {
        await responseHandler.rejected(error);
        expect.fail('Should have thrown ApiException');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiException);
        const apiException = err as ApiException;
        expect(apiException.status).toBe(0);
        expect(apiException.message).toBe('Request configuration error');
      }
    });
  });
});
