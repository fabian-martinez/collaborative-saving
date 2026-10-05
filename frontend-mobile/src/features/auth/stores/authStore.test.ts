/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './authStore';
import { authApi, type MemberProfile } from '@/api/auth.api';
import * as firebaseAuth from 'firebase/auth';

vi.mock('@/api/auth.api', () => ({
  authApi: {
    getMe: vi.fn(),
    validateEmail: vi.fn(),
  },
}));

vi.mock('@/shared/firebase/config', () => ({
  auth: { currentUser: null },
}));

vi.mock('firebase/auth', () => ({
  sendSignInLinkToEmail: vi.fn(),
  isSignInWithEmailLink: vi.fn(),
  signInWithEmailLink: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

describe('useAuthStore', () => {
  const mockProfile: MemberProfile = {
    id: 'member-1',
    name: 'Carlos Martínez',
    email: 'carlos.socio@ejemplo.com',
    role: 'member',
    status: 'active',
    identification_number: '1098765432',
    phone: '+573001234567',
  };

  const localStorageData: Record<string, string> = {};

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    for (const key of Object.keys(localStorageData)) {
      delete localStorageData[key];
    }

    // Mock global window object for test execution in node environment
    (globalThis as any).window = {
      location: { origin: 'http://localhost:5175' },
      localStorage: {
        getItem: (k: string) => localStorageData[k] ?? null,
        setItem: (k: string, v: string) => {
          localStorageData[k] = v;
        },
        removeItem: (k: string) => {
          delete localStorageData[k];
        },
        clear: () => {
          for (const key of Object.keys(localStorageData)) {
            delete localStorageData[key];
          }
        },
      },
    };
  });

  it('should initialize with empty state', () => {
    const store = useAuthStore();
    expect(store.user).toBeNull();
    expect(store.memberProfile).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  describe('init', () => {
    it('should hydrate real member profile when user is authenticated in onAuthStateChanged', async () => {
      const mockUser = {
        uid: 'firebase-uid-1',
        email: 'carlos.socio@ejemplo.com',
        getIdToken: vi.fn().mockResolvedValue('jwt-token'),
      };

      vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementation(
        (_auth, callback: any) => {
          callback(mockUser);
          return vi.fn();
        },
      );
      vi.mocked(authApi.getMe).mockResolvedValue(mockProfile);

      const store = useAuthStore();
      await store.init();

      expect(store.user).toBe(mockUser);
      expect(authApi.getMe).toHaveBeenCalledTimes(1);
      expect(store.memberProfile).toEqual(mockProfile);
      expect(store.isAuthenticated).toBe(true);
      expect(store.loading).toBe(false);
      expect(store.initialized).toBe(true);
    });

    it('should set memberProfile to null when no user is logged in', async () => {
      vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementation(
        (_auth, callback: any) => {
          callback(null);
          return vi.fn();
        },
      );

      const store = useAuthStore();
      await store.init();

      expect(store.user).toBeNull();
      expect(authApi.getMe).not.toHaveBeenCalled();
      expect(store.memberProfile).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(store.loading).toBe(false);
      expect(store.initialized).toBe(true);
    });

    it('should logout and clear profile when getMe fails during auth state change', async () => {
      const mockUser = {
        uid: 'firebase-uid-inactive',
        email: 'inactivo@ejemplo.com',
      };

      vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementation(
        (_auth, callback: any) => {
          callback(mockUser);
          return vi.fn();
        },
      );
      vi.mocked(authApi.getMe).mockRejectedValue(
        new Error('Member is not active'),
      );
      vi.mocked(firebaseAuth.signOut).mockResolvedValue();

      const store = useAuthStore();
      await store.init();

      expect(firebaseAuth.signOut).toHaveBeenCalled();
      expect(store.user).toBeNull();
      expect(store.memberProfile).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('completeMagicLinkLogin', () => {
    it('should complete magic link, fetch real profile and clean localStorage', async () => {
      const mockUser = {
        uid: 'firebase-uid-1',
        email: 'carlos.socio@ejemplo.com',
      };

      vi.mocked(firebaseAuth.isSignInWithEmailLink).mockReturnValue(true);
      vi.mocked(firebaseAuth.signInWithEmailLink).mockResolvedValue({
        user: mockUser,
      } as any);
      vi.mocked(authApi.getMe).mockResolvedValue(mockProfile);

      window.localStorage.setItem(
        'emailForSignIn',
        'carlos.socio@ejemplo.com',
      );

      const store = useAuthStore();
      const resultUser = await store.completeMagicLinkLogin(
        'https://app.mifondo.co/login?apiKey=xxx&oobCode=yyy',
      );

      expect(firebaseAuth.signInWithEmailLink).toHaveBeenCalledWith(
        expect.anything(),
        'carlos.socio@ejemplo.com',
        'https://app.mifondo.co/login?apiKey=xxx&oobCode=yyy',
      );
      expect(authApi.getMe).toHaveBeenCalledTimes(1);
      expect(store.memberProfile).toEqual(mockProfile);
      expect(store.user).toBe(mockUser);
      expect(window.localStorage.getItem('emailForSignIn')).toBeNull();
      expect(resultUser).toBe(mockUser);
    });

    it('should throw error if url is not a valid email sign-in link', async () => {
      vi.mocked(firebaseAuth.isSignInWithEmailLink).mockReturnValue(false);

      const store = useAuthStore();
      await expect(
        store.completeMagicLinkLogin('https://invalid-url.com'),
      ).rejects.toThrow('El enlace no es válido o ha expirado.');
    });

    it('should throw EMAIL_REQUIRED if email is not in localStorage or params', async () => {
      vi.mocked(firebaseAuth.isSignInWithEmailLink).mockReturnValue(true);

      const store = useAuthStore();
      await expect(
        store.completeMagicLinkLogin('https://valid-url.com'),
      ).rejects.toThrow('EMAIL_REQUIRED');
    });
  });

  describe('logout', () => {
    it('should sign out from firebase and clear local state', async () => {
      vi.mocked(firebaseAuth.signOut).mockResolvedValue();

      const store = useAuthStore();
      store.user = { uid: '1' } as any;
      store.memberProfile = mockProfile;

      await store.logout();

      expect(firebaseAuth.signOut).toHaveBeenCalled();
      expect(store.user).toBeNull();
      expect(store.memberProfile).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return null when there is no user', async () => {
      const store = useAuthStore();
      const token = await store.getToken();
      expect(token).toBeNull();
    });

    it('should call getIdToken on user if present', async () => {
      const store = useAuthStore();
      const getIdToken = vi.fn().mockResolvedValue('firebase-token-123');
      store.user = { getIdToken } as any;

      const token = await store.getToken();
      expect(token).toBe('firebase-token-123');
      expect(getIdToken).toHaveBeenCalledTimes(1);
    });
  });
});
