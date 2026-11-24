/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { defineStore } from 'pinia';
import { ref, shallowRef, computed } from 'vue';
import {
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
  type User,
  type ActionCodeSettings
} from 'firebase/auth';
import { auth } from '@/shared/firebase/config';
import { authApi, type AuthenticatedMemberProfile } from '@/api/auth.api';

export const useAuthStore = defineStore('auth', () => {
  const user = shallowRef<User | null>(null);
  const memberProfile = ref<AuthenticatedMemberProfile | null>(null);
  const loading = ref(true);
  const initialized = ref(false);

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => memberProfile.value?.role === 'admin');

  async function loadMemberProfile() {
    if (!user.value) {
      memberProfile.value = null;
      return null;
    }
    try {
      const profile = await authApi.getMe();
      memberProfile.value = profile;
      return profile;
    } catch (error) {
      console.error('Failed to load authenticated member profile:', error);
      memberProfile.value = null;
      return null;
    }
  }

  function init() {
    return new Promise<void>((resolve) => {
      onAuthStateChanged(auth, async (currentUser) => {
        user.value = currentUser;
        if (currentUser) {
          await loadMemberProfile();
        } else {
          memberProfile.value = null;
        }
        loading.value = false;
        initialized.value = true;
        resolve();
      });
    });
  }

  async function login(email: string, pass: string) {
    try {
      loading.value = true;
      const credential = await signInWithEmailAndPassword(auth, email, pass);
      user.value = credential.user;
      await loadMemberProfile();
      return credential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function sendMagicLink(email: string) {
    try {
      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
    } catch (error) {
      console.error('Send magic link error:', error);
      throw error;
    }
  }

  async function completeMagicLinkLogin(url: string, emailParam?: string) {
    if (!isSignInWithEmailLink(auth, url)) {
      throw new Error('El enlace no es válido o ha expirado.');
    }

    const email = emailParam || window.localStorage.getItem('emailForSignIn');
    if (!email) {
      throw new Error('EMAIL_REQUIRED');
    }

    try {
      const credential = await signInWithEmailLink(auth, email, url);
      user.value = credential.user;
      window.localStorage.removeItem('emailForSignIn');
      await loadMemberProfile();
      return credential.user;
    } catch (error) {
      console.error('Complete magic link login error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      user.value = null;
      memberProfile.value = null;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async function getToken(): Promise<string | null> {
    const currentUser = user.value || auth.currentUser;
    if (!currentUser) return null;
    if (typeof currentUser.getIdToken === 'function') {
      return currentUser.getIdToken();
    }
    return 'mock-token';
  }

  return {
    user,
    memberProfile,
    loading,
    initialized,
    isAuthenticated,
    isAdmin,
    loadMemberProfile,
    init,
    login,
    sendMagicLink,
    completeMagicLinkLogin,
    logout,
    getToken
  };
});
