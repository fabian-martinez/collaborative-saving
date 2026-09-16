/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import router from '../src/router';
import { useAuthStore } from '../src/features/auth/stores/authStore';
import * as firebaseAuth from 'firebase/auth';

/**
 * @vitest-environment jsdom
 */

vi.mock('../src/features/auth/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  isSignInWithEmailLink: vi.fn(),
}));

vi.mock('../src/shared/firebase/config', () => ({
  auth: {},
}));

describe('router navigation guards with magic link', () => {
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
    vi.mocked(firebaseAuth.isSignInWithEmailLink).mockReturnValue(false);
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

  it('allows access to /login even if already authenticated when magic link parameters are present', async () => {
    mockAuthStore.isAuthenticated = true;
    vi.mocked(firebaseAuth.isSignInWithEmailLink).mockReturnValue(true);

    await router.push({
      path: '/login',
      query: { apiKey: 'key123', oobCode: 'code456' },
    });

    expect(router.currentRoute.value.name).toBe('login');
    expect(router.currentRoute.value.query.apiKey).toBe('key123');
    expect(router.currentRoute.value.query.oobCode).toBe('code456');
  });

  it('redirects to /login preserving query params when unauthenticated user lands on protected route with magic link params', async () => {
    mockAuthStore.isAuthenticated = false;
    vi.mocked(firebaseAuth.isSignInWithEmailLink).mockReturnValue(true);

    await router.push({
      path: '/dashboard',
      query: { apiKey: 'key123', oobCode: 'code456' },
    });

    expect(router.currentRoute.value.name).toBe('login');
    expect(router.currentRoute.value.query.apiKey).toBe('key123');
    expect(router.currentRoute.value.query.oobCode).toBe('code456');
  });
});
