<script setup lang="ts">
/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import ErrorMessage from '@/shared/components/ErrorMessage.vue';
import apiClient from '@/api/client';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleLogin() {
  const targetEmail = email.value.trim();
  const targetPassword = password.value;

  if (!targetEmail || !targetPassword) {
    error.value = 'Por favor ingresa tu correo y contraseña.';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    await authStore.login(targetEmail, targetPassword);

    // Validar si el usuario está registrado en la base de datos de socios
    await apiClient.get('/v2/dashboard');

    const redirect = (route.query.redirect as string) || '/dashboard';
    router.push(redirect);
  } catch (e: any) {
    if (
      e.status === 401 ||
      (e.response && e.response.status === 401) ||
      e.message?.includes('401')
    ) {
      error.value =
        'Este correo no está registrado como socio activo en el fondo. Contacta al administrador.';
      await authStore.logout();
    } else if (
      e.code === 'auth/invalid-credential' ||
      e.code === 'auth/user-not-found' ||
      e.code === 'auth/wrong-password'
    ) {
      error.value = 'Correo electrónico o contraseña incorrectos.';
    } else if (e.code === 'auth/invalid-email') {
      error.value = 'Formato de correo electrónico no válido.';
    } else if (e.code === 'auth/too-many-requests') {
      error.value =
        'Demasiados intentos fallidos. Por favor, espere un momento antes de intentar de nuevo.';
    } else if (e.code === 'auth/user-disabled') {
      error.value = 'Esta cuenta ha sido inhabilitada. Contacte al administrador.';
    } else {
      error.value = e?.message || 'Ocurrió un error al iniciar sesión. Intente de nuevo.';
      if (authStore.isAuthenticated) {
        await authStore.logout();
      }
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200 p-4">
    <div class="card w-full max-w-md bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title justify-center text-2xl font-bold mb-1">Iniciar Sesión</h2>
        <p class="text-sm text-base-content/70 text-center mb-4">
          Ingresa tus credenciales para acceder a la administración del fondo.
        </p>

        <form @submit.prevent="handleLogin">
          <div class="form-control w-full mb-4">
            <label class="label" for="email">
              <span class="label-text font-medium">Correo Electrónico</span>
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="correo@ejemplo.com"
              class="input input-bordered w-full"
              required
              autocomplete="username"
            />
          </div>

          <div class="form-control w-full mb-2">
            <label class="label" for="password">
              <span class="label-text font-medium">Contraseña</span>
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="input input-bordered w-full"
              required
              autocomplete="current-password"
            />
          </div>

          <ErrorMessage
            v-if="error"
            :error="error"
            title="Error al ingresar"
            class="mt-4"
          />

          <div class="card-actions justify-end mt-6">
            <button
              type="submit"
              class="btn btn-primary w-full"
              :disabled="loading"
            >
              <span v-if="loading" class="loading loading-spinner"></span>
              <span v-if="loading">Iniciando sesión...</span>
              <span v-else>Iniciar Sesión</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
