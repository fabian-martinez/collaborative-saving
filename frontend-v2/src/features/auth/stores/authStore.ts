import { defineStore } from 'pinia';
import { ref, shallowRef, computed } from 'vue';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { auth } from '@/shared/firebase/config';

export const useAuthStore = defineStore('auth', () => {
  const user = shallowRef<User | null>(null);
  const loading = ref(true);
  const initialized = ref(false);

  const isAuthenticated = computed(() => !!user.value);

  function init() {
    return new Promise<void>((resolve) => {
      onAuthStateChanged(auth, (currentUser) => {
        user.value = currentUser;
        loading.value = false;
        initialized.value = true;
        resolve();
      });
    });
  }

  async function login(email: string, password: string) {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      user.value = credential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      user.value = null;
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
    loading,
    initialized,
    isAuthenticated,
    init,
    login,
    logout,
    getToken
  };
});
