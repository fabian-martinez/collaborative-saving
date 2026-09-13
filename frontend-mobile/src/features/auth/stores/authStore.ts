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
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    await signOut(auth);
    user.value = null;
    memberProfile.value = null;
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
    login,
    logout,
    getToken
  };
});
