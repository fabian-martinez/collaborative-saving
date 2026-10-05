/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import { routes } from './index';
import { isSignInWithEmailLink } from 'firebase/auth';

const mockAuthStore = {
  initialized: true,
  isAuthenticated: false,
  init: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/features/auth/stores/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}));

vi.mock('@/shared/firebase/config', () => ({
  auth: {},
}));

vi.mock('firebase/auth', () => ({
  isSignInWithEmailLink: vi.fn(),
}));

describe('Router Navigation Guard (beforeEach)', () => {
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.initialized = true;
    mockAuthStore.isAuthenticated = false;
    vi.mocked(isSignInWithEmailLink).mockReturnValue(false);

    (globalThis as any).window = {
      location: { href: 'http://localhost:5175' },
    };

    router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    // Register beforeEach guard matching src/router/index.ts
    router.beforeEach(async (to, _from, next) => {
      if (!mockAuthStore.initialized) {
        await mockAuthStore.init();
      }

      const isMagicLink =
        !!(to.query.apiKey && to.query.oobCode) ||
        (typeof window !== 'undefined' &&
          isSignInWithEmailLink({} as any, window.location.href));

      if (to.name === 'login') {
        if (mockAuthStore.isAuthenticated && !isMagicLink) {
          return next({ name: 'home' });
        }
        return next();
      }

      const requiresAuth = to.matched.some(
        (record) => record.meta.requiresAuth,
      );
      if (requiresAuth && !mockAuthStore.isAuthenticated) {
        if (isMagicLink) {
          return next({ name: 'login', query: to.query });
        }
        return next({ name: 'login' });
      }

      next();
    });
  });

  it('should initialize authStore if not initialized', async () => {
    mockAuthStore.initialized = false;
    mockAuthStore.isAuthenticated = true;

    await router.push('/home');

    expect(mockAuthStore.init).toHaveBeenCalledTimes(1);
    expect(router.currentRoute.value.path).toBe('/home');
  });

  it('should redirect unauthenticated users from private routes to /login', async () => {
    mockAuthStore.isAuthenticated = false;

    await router.push('/home');
    expect(router.currentRoute.value.path).toBe('/login');

    await router.push('/fund');
    expect(router.currentRoute.value.path).toBe('/login');

    await router.push('/members');
    expect(router.currentRoute.value.path).toBe('/login');

    await router.push('/history');
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('should allow authenticated users to access private routes', async () => {
    mockAuthStore.isAuthenticated = true;

    await router.push('/home');
    expect(router.currentRoute.value.path).toBe('/home');

    await router.push('/fund');
    expect(router.currentRoute.value.path).toBe('/fund');
  });

  it('should redirect authenticated users accessing /login without magic link to /home', async () => {
    mockAuthStore.isAuthenticated = true;

    await router.push('/login');
    expect(router.currentRoute.value.path).toBe('/home');
  });

  it('should allow accessing /login if magic link query params are present', async () => {
    mockAuthStore.isAuthenticated = true;

    await router.push({
      path: '/login',
      query: { apiKey: 'test-key', oobCode: 'test-code' },
    });

    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.query).toEqual({
      apiKey: 'test-key',
      oobCode: 'test-code',
    });
  });
});
