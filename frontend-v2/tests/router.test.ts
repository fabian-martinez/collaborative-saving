/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import router from '../src/router';
import { useAuthStore } from '../src/features/auth/stores/authStore';

/**
 * @vitest-environment jsdom
 */

vi.mock('../src/features/auth/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../src/shared/firebase/config', () => ({
  auth: {},
}));

describe('router navigation guards with username/password authentication', () => {
  let mockAuthStore: {
    isAuthenticated: boolean;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore = {
      isAuthenticated: false,
    };
    vi.mocked(useAuthStore).mockReturnValue(
      mockAuthStore as unknown as ReturnType<typeof useAuthStore>,
    );
  });

  it('redirects unauthenticated user to /login with redirect query param', async () => {
    mockAuthStore.isAuthenticated = false;

    await router.push('/dashboard');

    expect(router.currentRoute.value.name).toBe('login');
    expect(router.currentRoute.value.query.redirect).toBe('/dashboard');
  });

  it('redirects authenticated user trying to access /login to /dashboard', async () => {
    mockAuthStore.isAuthenticated = true;

    await router.push('/login');

    expect(router.currentRoute.value.name).toBe('dashboard');
  });

  it('allows unauthenticated user to access /login directly', async () => {
    mockAuthStore.isAuthenticated = false;

    await router.push('/login');

    expect(router.currentRoute.value.name).toBe('login');
  });

  it('allows authenticated user to navigate to protected routes', async () => {
    mockAuthStore.isAuthenticated = true;

    await router.push('/dashboard');

    expect(router.currentRoute.value.name).toBe('dashboard');
  });
});
