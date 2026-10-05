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
  type ActionCodeSettings,
} from 'firebase/auth';
import { auth } from '@/shared/firebase/config';
import { authApi, type MemberProfile } from '@/api/auth.api';

export const useAuthStore = defineStore('auth', () => {
  const user = shallowRef<User | null>(null);
  const memberProfile = ref<MemberProfile | null>(null);
  const loading = ref(true);
  const initialized = ref(false);

  const isAuthenticated = computed(() => !!user.value && !!memberProfile.value);

  async function fetchProfile(): Promise<MemberProfile | null> {
    try {
      const profile = await authApi.getMe();
      memberProfile.value = profile;
      return profile;
    } catch (error) {
      console.error('[authStore] Error al cargar perfil del socio:', error);
      memberProfile.value = null;
      throw error;
    }
  }

  function init(): Promise<void> {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (currentUser) => {
        loading.value = true;
        user.value = currentUser;
        if (currentUser) {
          try {
            await fetchProfile();
          } catch (error) {
            console.error(
              '[authStore] Falló la carga del perfil en auth state change:',
              error,
            );
            await logout();
          }
        } else {
          memberProfile.value = null;
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
        handleCodeInApp: true,
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
      await fetchProfile();
      window.localStorage.removeItem('emailForSignIn');
      return credential.user;
    } catch (error) {
      console.error(
        '[authStore] Error al completar inicio de sesión con enlace mágico:',
        error,
      );
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('[authStore] Error al cerrar sesión:', error);
      throw error;
    } finally {
      user.value = null;
      memberProfile.value = null;
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
    fetchProfile,
    sendMagicLink,
    completeMagicLinkLogin,
    logout,
    getToken,
  };
});
