/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../src/features/auth/stores/authStore';
import * as firebaseAuth from 'firebase/auth';

/**
 * @vitest-environment jsdom
 */

vi.mock('firebase/auth', () => ({
  sendSignInLinkToEmail: vi.fn(),
  isSignInWithEmailLink: vi.fn(),
  signInWithEmailLink: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((_auth, callback) => {
    callback(null);
    return () => {};
  }),
}));

vi.mock('../src/shared/firebase/config', () => ({
  auth: {
    currentUser: null,
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  describe('sendMagicLink', () => {
    it('sends sign-in link and stores email in localStorage', async () => {
      // ARRANGE
      const authStore = useAuthStore();
      const email = 'socio@ejemplo.com';
      vi.mocked(firebaseAuth.sendSignInLinkToEmail).mockResolvedValue(undefined);

      // ACT
      await authStore.sendMagicLink(email);

      // ASSERT
      expect(firebaseAuth.sendSignInLinkToEmail).toHaveBeenCalledWith(
        expect.anything(),
        email,
        expect.objectContaining({
          url: `${window.location.origin}/login`,
          handleCodeInApp: true,
        }),
      );
      expect(window.localStorage.getItem('emailForSignIn')).toBe(email);
    });

    it('propagates error when sending sign-in link fails', async () => {
      // ARRANGE
      const authStore = useAuthStore();
      const email = 'error@ejemplo.com';
      const sendError = new Error('Firebase send error');
      vi.mocked(firebaseAuth.sendSignInLinkToEmail).mockRejectedValue(sendError);

      // ACT & ASSERT
      await expect(authStore.sendMagicLink(email)).rejects.toThrow('Firebase send error');
    });
  });

  describe('completeMagicLinkLogin', () => {
    it('throws error if url is not a valid sign-in email link', async () => {
      // ARRANGE
      const authStore = useAuthStore();
      vi.mocked(firebaseAuth.isSignInWithEmailLink).mockReturnValue(false);

      // ACT & ASSERT
      await expect(
        authStore.completeMagicLinkLogin('https://example.com/invalid-link'),
      ).rejects.toThrow('El enlace no es válido o ha expirado.');
    });

    it('throws EMAIL_REQUIRED error if no email is found in localStorage and none provided', async () => {
      // ARRANGE
      const authStore = useAuthStore();
      vi.mocked(firebaseAuth.isSignInWithEmailLink).mockReturnValue(true);
      // localStorage is empty

      // ACT & ASSERT
      await expect(
        authStore.completeMagicLinkLogin('https://example.com/login?apiKey=abc&oobCode=123'),
      ).rejects.toThrow('EMAIL_REQUIRED');
    });

    it('completes login using email stored in localStorage', async () => {
      // ARRANGE
      const authStore = useAuthStore();
      const email = 'socio@ejemplo.com';
      const mockUser = { uid: 'user-123', email } as firebaseAuth.User;
      window.localStorage.setItem('emailForSignIn', email);

      vi.mocked(firebaseAuth.isSignInWithEmailLink).mockReturnValue(true);
      vi.mocked(firebaseAuth.signInWithEmailLink).mockResolvedValue({
        user: mockUser,
      } as firebaseAuth.UserCredential);

      // ACT
      const user = await authStore.completeMagicLinkLogin(
        'https://example.com/login?apiKey=abc&oobCode=123',
      );

      // ASSERT
      expect(firebaseAuth.signInWithEmailLink).toHaveBeenCalledWith(
        expect.anything(),
        email,
        'https://example.com/login?apiKey=abc&oobCode=123',
      );
      expect(user).toEqual(mockUser);
      expect(authStore.user).toEqual(mockUser);
      expect(authStore.isAuthenticated).toBe(true);
      expect(window.localStorage.getItem('emailForSignIn')).toBeNull();
    });

    it('completes login using explicit email parameter (cross-device/browser flow)', async () => {
      // ARRANGE
      const authStore = useAuthStore();
      const explicitEmail = 'otro-navegador@ejemplo.com';
      const mockUser = { uid: 'user-456', email: explicitEmail } as firebaseAuth.User;

      vi.mocked(firebaseAuth.isSignInWithEmailLink).mockReturnValue(true);
      vi.mocked(firebaseAuth.signInWithEmailLink).mockResolvedValue({
        user: mockUser,
      } as firebaseAuth.UserCredential);

      // ACT
      const user = await authStore.completeMagicLinkLogin(
        'https://example.com/login?apiKey=abc&oobCode=123',
        explicitEmail,
      );

      // ASSERT
      expect(firebaseAuth.signInWithEmailLink).toHaveBeenCalledWith(
        expect.anything(),
        explicitEmail,
        'https://example.com/login?apiKey=abc&oobCode=123',
      );
      expect(user).toEqual(mockUser);
      expect(authStore.user).toEqual(mockUser);
      expect(authStore.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('signs out and resets user to null', async () => {
      // ARRANGE
      const authStore = useAuthStore();
      authStore.user = { uid: 'user-123' } as firebaseAuth.User;
      vi.mocked(firebaseAuth.signOut).mockResolvedValue(undefined);

      // ACT
      await authStore.logout();

      // ASSERT
      expect(firebaseAuth.signOut).toHaveBeenCalled();
      expect(authStore.user).toBeNull();
      expect(authStore.isAuthenticated).toBe(false);
    });
  });

  describe('getToken', () => {
    it('returns null if no user is signed in', async () => {
      const authStore = useAuthStore();
      authStore.user = null;
      const token = await authStore.getToken();
      expect(token).toBeNull();
    });

    it('returns token from user if getIdToken is available', async () => {
      const authStore = useAuthStore();
      authStore.user = {
        getIdToken: vi.fn().mockResolvedValue('firebase-token-123'),
      } as unknown as firebaseAuth.User;

      const token = await authStore.getToken();
      expect(token).toBe('firebase-token-123');
    });
  });
});
