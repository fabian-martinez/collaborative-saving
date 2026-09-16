<script setup lang="ts">
/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import ErrorMessage from '@/shared/components/ErrorMessage.vue';
import { Mail, Refresh, ArrowLeft } from 'iconoir-vue/regular';
import { isSignInWithEmailLink } from 'firebase/auth';
import { auth } from '@/shared/firebase/config';
import apiClient from '@/api/client';
import { authApi } from '@/api/auth.api';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// Form states
const email = ref('');
const submittedEmail = ref('');
const error = ref('');
const loading = ref(false);
const linkSent = ref(false);

// Cooldown state
const cooldown = ref(0);
let cooldownTimer: ReturnType<typeof setInterval> | null = null;

// Magic link landing states
const isVerifyingLink = ref(false);
const showConfirmEmailModal = ref(false);
const confirmEmail = ref('');
const confirmError = ref('');
const confirmLoading = ref(false);

function startCooldown(seconds = 60) {
  cooldown.value = seconds;
  if (cooldownTimer) {
    clearInterval(cooldownTimer);
  }
  cooldownTimer = setInterval(() => {
    if (cooldown.value > 0) {
      cooldown.value--;
    } else {
      if (cooldownTimer) {
        clearInterval(cooldownTimer);
        cooldownTimer = null;
      }
    }
  }, 1000);
}

onUnmounted(() => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer);
    cooldownTimer = null;
  }
});

async function handleSendMagicLink(emailToSend?: string) {
  const targetEmail = (emailToSend || email.value).trim();
  if (!targetEmail) return;

  loading.value = true;
  error.value = '';

  try {
    // 1. Verificación previa de socio activo
    const validation = await authApi.validateEmail(targetEmail);
    if (!validation.exists || !validation.active) {
      error.value =
        'Este correo no está registrado como socio activo en el fondo. Contacta al administrador.';
      return;
    }

    // 2. Enviar Magic Link
    await authStore.sendMagicLink(targetEmail);
    submittedEmail.value = targetEmail;
    linkSent.value = true;
    startCooldown(60);
  } catch (e: any) {
    if (e.response?.status === 429) {
      error.value =
        'Demasiados intentos. Por favor, espere un momento antes de intentar de nuevo.';
    } else if (e.code === 'auth/invalid-email') {
      error.value = 'Formato de correo electrónico no válido.';
    } else {
      error.value = 'Ocurrió un error al enviar el enlace. Intente de nuevo.';
    }
  } finally {
    loading.value = false;
  }
}

function handleResend() {
  if (cooldown.value > 0 || loading.value) return;
  handleSendMagicLink(submittedEmail.value);
}

function resetForm() {
  linkSent.value = false;
  error.value = '';
}

async function processLogin(targetEmail: string, url: string) {
  isVerifyingLink.value = true;
  error.value = '';

  try {
    await authStore.completeMagicLinkLogin(url, targetEmail);

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
      e.code === 'auth/invalid-action-code' ||
      e.code === 'auth/expired-action-code'
    ) {
      error.value =
        'El enlace de acceso no es válido o ha expirado. Por favor, solicita uno nuevo.';
    } else if (e.message === 'El enlace no es válido o ha expirado.') {
      error.value = e.message;
    } else {
      error.value = 'Ocurrió un error al iniciar sesión. Intente de nuevo.';
    }
  } finally {
    isVerifyingLink.value = false;
  }
}

async function handleConfirmEmailSubmit() {
  const targetEmail = confirmEmail.value.trim();
  if (!targetEmail) return;

  confirmLoading.value = true;
  confirmError.value = '';

  try {
    // Verificación previa de socio activo
    const validation = await authApi.validateEmail(targetEmail);
    if (!validation.exists || !validation.active) {
      confirmError.value =
        'Este correo no está registrado como socio activo en el fondo. Contacta al administrador.';
      return;
    }

    showConfirmEmailModal.value = false;
    await processLogin(targetEmail, window.location.href);
  } catch (e: any) {
    if (e.response?.status === 429) {
      confirmError.value =
        'Demasiados intentos. Por favor, espere un momento antes de intentar de nuevo.';
    } else {
      confirmError.value =
        'Error al validar el correo electrónico. Intente de nuevo.';
    }
  } finally {
    confirmLoading.value = false;
  }
}

function cancelConfirmModal() {
  showConfirmEmailModal.value = false;
}

onMounted(async () => {
  const currentUrl = window.location.href;
  if (isSignInWithEmailLink(auth, currentUrl)) {
    const storedEmail = window.localStorage.getItem('emailForSignIn');
    if (storedEmail) {
      await processLogin(storedEmail, currentUrl);
    } else {
      // Dispositivo o navegador distinto: solicitar confirmación de email
      showConfirmEmailModal.value = true;
    }
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200 p-4">
    <!-- Estado: Verificando enlace mágico -->
    <div v-if="isVerifyingLink" class="card w-full max-w-md bg-base-100 shadow-xl text-center py-8">
      <div class="card-body items-center">
        <span class="loading loading-spinner loading-lg text-primary mb-4"></span>
        <h2 class="card-title text-2xl font-bold">Verificando enlace...</h2>
        <p class="text-base-content/70 text-sm mt-2">
          Estamos comprobando tu enlace de acceso para iniciar sesión automáticamente.
        </p>
      </div>
    </div>

    <!-- Estado: Enlace enviado ("Revisa tu correo") -->
    <div v-else-if="linkSent" class="card w-full max-w-md bg-base-100 shadow-xl">
      <div class="card-body items-center text-center">
        <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
          <Mail class="w-8 h-8" />
        </div>
        <h2 class="card-title text-2xl font-bold">Revisa tu correo</h2>
        <p class="text-base-content/70 text-sm mt-1">
          Hemos enviado un enlace mágico de acceso a:
        </p>
        <p class="font-semibold text-base text-base-content break-all mt-1">
          {{ submittedEmail }}
        </p>
        <p class="text-xs text-base-content/60 mt-3">
          Haz clic en el enlace recibido en tu bandeja de entrada (o carpeta de spam) para iniciar sesión directamente.
        </p>

        <ErrorMessage
          v-if="error"
          :error="error"
          title="Error al reenviar"
          class="mt-4 w-full text-left"
        />

        <div class="card-actions flex-col w-full gap-3 mt-6">
          <button
            type="button"
            class="btn btn-primary w-full"
            :disabled="cooldown > 0 || loading"
            @click="handleResend"
          >
            <span v-if="loading" class="loading loading-spinner"></span>
            <Refresh v-else class="w-4 h-4 mr-1" />
            <span v-if="cooldown > 0">Reenviar enlace en {{ cooldown }}s</span>
            <span v-else>Reenviar enlace</span>
          </button>

          <button
            type="button"
            class="btn btn-ghost btn-sm w-full gap-2 text-base-content/70 hover:text-base-content"
            @click="resetForm"
          >
            <ArrowLeft class="w-4 h-4" />
            ¿Ingresaste un correo incorrecto? Cambiar
          </button>
        </div>
      </div>
    </div>

    <!-- Estado: Formulario inicial de solicitud de enlace -->
    <div v-else class="card w-full max-w-md bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title justify-center text-2xl font-bold mb-2">Iniciar Sesión</h2>
        <p class="text-sm text-base-content/70 text-center mb-4">
          Ingresa tu correo electrónico y te enviaremos un enlace mágico de acceso directo sin contraseña.
        </p>

        <form @submit.prevent="handleSendMagicLink()">
          <div class="form-control w-full">
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
              autocomplete="email"
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
              Enviar Enlace Mágico
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Diálogo modal para confirmación de correo (dispositivo o navegador distinto) -->
  <dialog
    :open="showConfirmEmailModal"
    class="modal bg-black/50 z-50"
    :class="{ 'modal-open': showConfirmEmailModal }"
  >
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-2">Confirmar Correo Electrónico</h3>
      <p class="text-sm text-base-content/70 mb-4">
        Parece que abriste el enlace en un navegador o dispositivo diferente. Por seguridad, por favor confirma tu correo electrónico para iniciar sesión.
      </p>

      <form @submit.prevent="handleConfirmEmailSubmit">
        <div class="form-control w-full">
          <label class="label" for="confirm-email">
            <span class="label-text">Correo Electrónico</span>
          </label>
          <input
            id="confirm-email"
            v-model="confirmEmail"
            type="email"
            placeholder="correo@ejemplo.com"
            class="input input-bordered w-full"
            required
            autocomplete="email"
          />
        </div>

        <ErrorMessage
          v-if="confirmError"
          :error="confirmError"
          title="Error de confirmación"
          class="mt-4"
        />

        <div class="modal-action mt-6">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="confirmLoading"
            @click="cancelConfirmModal"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="confirmLoading"
          >
            <span v-if="confirmLoading" class="loading loading-spinner"></span>
            Confirmar e Iniciar Sesión
          </button>
        </div>
      </form>
    </div>
  </dialog>
</template>
