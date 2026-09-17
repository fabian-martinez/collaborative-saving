/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { defineStore } from 'pinia';
import { ref, shallowRef, computed } from 'vue';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
  type User,
  type ActionCodeSettings
} from 'firebase/auth';
import { auth } from '@/shared/firebase/config';

export const useAuthStore = defineStore('auth', () => {
  const user = shallowRef<User | null>(null);
  const memberProfile = ref<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>({
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Carlos Martínez',
    email: 'carlos.socio@ejemplo.com',
    role: 'member'
  });
  const loading = ref(true);
  const initialized = ref(false);

  const isAuthenticated = computed(() => !!user.value);

  function init(): Promise<void> {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (currentUser) => {
        user.value = currentUser;
        if (currentUser?.email && memberProfile.value) {
          memberProfile.value.email = currentUser.email;
        }
        loading.value = false;
        initialized.value = true;
        resolve();
      });
    });
  }

  async function sendMagicLink(email: string) {
    try {
      loading.value = true;
      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
    } catch (error) {
      console.error('[authStore] Error al enviar enlace mágico:', error);
      throw error;
    } finally {
      loading.value = false;
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
      loading.value = true;
      const credential = await signInWithEmailLink(auth, email, url);
      user.value = credential.user;
      if (credential.user?.email && memberProfile.value) {
        memberProfile.value.email = credential.user.email;
      }
      window.localStorage.removeItem('emailForSignIn');
      return credential.user;
    } catch (error) {
      console.error('[authStore] Error al completar inicio de sesión con enlace mágico:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      user.value = null;
      memberProfile.value = null;
    } catch (error) {
      console.error('[authStore] Error al cerrar sesión:', error);
      throw error;
    }
  }

  async function getToken(): Promise<string | null> {
    const currentUser = user.value || auth.currentUser;
    if (!currentUser) return null;
    if (typeof currentUser.getIdToken === 'function') {
      return currentUser.getIdToken();
    }
    return 'mock-socio-token';
  }

  return {
    user,
    memberProfile,
    loading,
    initialized,
    isAuthenticated,
    init,
    sendMagicLink,
    completeMagicLinkLogin,
    logout,
    getToken
  };
});
