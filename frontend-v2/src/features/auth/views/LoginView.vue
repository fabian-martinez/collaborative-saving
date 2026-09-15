<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import ErrorMessage from '@/shared/components/ErrorMessage.vue';
import { Eye, EyeClosed } from 'iconoir-vue/regular';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/shared/firebase/config';
import apiClient from '@/api/client';
import { authApi } from '@/api/auth.api';

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const showPassword = ref(false);

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// Estados para recuperar contraseña
const showForgotPassword = ref(false);
const resetEmail = ref('');
const resetError = ref('');
const resetSuccess = ref(false);
const resetLoading = ref(false);

async function handleLogin() {
  if (!email.value || !password.value) return;

  loading.value = true;
  error.value = '';

  try {
    // Verificación previa de socio activo
    const validation = await authApi.validateEmail(email.value);
    if (!validation.exists || !validation.active) {
      error.value =
        'Este correo no está registrado como socio activo en el fondo. Contacta al administrador.';
      loading.value = false;
      return;
    }

    await authStore.login(email.value, password.value);

    // Validar si el usuario está registrado en la base de datos de socios
    // Si no está registrado, el endpoint lanzará un error 401 que capturaremos en el catch
    await apiClient.get('/v2/dashboard');

    const redirect = (route.query.redirect as string) || '/dashboard';
    router.push(redirect);
  } catch (e: any) {
    if (e.response?.status === 429) {
      error.value =
        'Demasiados intentos. Por favor, espere un momento antes de intentar de nuevo.';
    } else if (e.code === 'auth/invalid-credential') {
      error.value = 'Correo o contraseña incorrectos';
    } else if (
      e.status === 401 ||
      (e.response && e.response.status === 401) ||
      e.message?.includes('401')
    ) {
      error.value =
        'Este correo no está registrado como socio activo en el fondo. Contacta al administrador.';
      await authStore.logout();
    } else {
      error.value = 'Ocurrió un error al iniciar sesión. Intente de nuevo.';
    }
  } finally {
    loading.value = false;
  }
}

function openForgotPassword() {
  resetEmail.value = email.value;
  resetError.value = '';
  resetSuccess.value = false;
  showForgotPassword.value = true;
}

function closeForgotPassword() {
  showForgotPassword.value = false;
}

async function handleResetPassword() {
  if (!resetEmail.value) return;
  resetLoading.value = true;
  resetError.value = '';
  resetSuccess.value = false;

  try {
    const validation = await authApi.validateEmail(resetEmail.value);
    if (!validation.exists || !validation.active) {
      resetError.value =
        'Este correo no está registrado como socio activo en el fondo. Contacta al administrador.';
      resetLoading.value = false;
      return;
    }

    await sendPasswordResetEmail(auth, resetEmail.value);
    resetSuccess.value = true;
    setTimeout(() => {
      showForgotPassword.value = false;
    }, 3000);
  } catch (e: any) {
    if (e.response?.status === 429) {
      resetError.value =
        'Demasiados intentos. Por favor, espere un momento antes de intentar de nuevo.';
    } else if (e.code === 'auth/user-not-found') {
      resetError.value = 'No existe ningún usuario registrado con este correo.';
    } else if (e.code === 'auth/invalid-email') {
      resetError.value = 'Formato de correo electrónico no válido.';
    } else {
      resetError.value =
        'Ocurrió un error al enviar el correo. Intente de nuevo.';
    }
  } finally {
    resetLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200">
    <div class="card w-96 bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title justify-center text-2xl font-bold mb-4">Iniciar Sesión</h2>

        <form @submit.prevent="handleLogin">
          <div class="form-control w-full">
            <label class="label" for="email">
              <span class="label-text">Correo Electrónico</span>
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="correo@ejemplo.com"
              class="input input-bordered w-full"
              required
            />
          </div>

          <div class="form-control w-full mt-4">
            <label class="label" for="password">
              <span class="label-text">Contraseña</span>
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="input input-bordered w-full pr-10"
                required
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 px-3 flex items-center text-base-content/60 hover:text-base-content"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                :aria-pressed="showPassword"
              >
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeClosed v-else class="w-5 h-5" />
              </button>
            </div>
            <!-- Enlace Recuperar Contraseña -->
            <div class="text-right mt-2">
              <button
                type="button"
                class="text-xs link link-hover text-primary font-medium"
                @click="openForgotPassword"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
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
              Ingresar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Modal de Recuperar Contraseña -->
  <dialog :open="showForgotPassword" class="modal bg-black/50 z-50" :class="{ 'modal-open': showForgotPassword }">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Recuperar Contraseña</h3>
      <p class="text-sm text-base-content/70 mb-4">
        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
      </p>
      
      <form @submit.prevent="handleResetPassword">
        <div class="form-control w-full">
          <label class="label" for="reset-email">
            <span class="label-text">Correo Electrónico</span>
          </label>
          <input
            id="reset-email"
            v-model="resetEmail"
            type="email"
            placeholder="correo@ejemplo.com"
            class="input input-bordered w-full"
            required
          />
        </div>

        <ErrorMessage
          v-if="resetError"
          :error="resetError"
          title="Error de recuperación"
          class="mt-4"
        />

        <div v-if="resetSuccess" class="alert alert-success shadow-sm mt-4 text-sm">
          <span>Se ha enviado un correo con instrucciones para restablecer tu contraseña.</span>
        </div>

        <div class="modal-action mt-6">
          <button
            type="button"
            class="btn btn-ghost"
            @click="closeForgotPassword"
            :disabled="resetLoading"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="resetLoading || resetSuccess"
          >
            <span v-if="resetLoading" class="loading loading-spinner"></span>
            Enviar Enlace
          </button>
        </div>
      </form>
    </div>
  </dialog>
</template>
