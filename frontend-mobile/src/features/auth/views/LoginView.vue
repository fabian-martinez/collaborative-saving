<script setup lang="ts">
/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { Mail, Refresh, ArrowLeft } from 'iconoir-vue/regular';
import { isSignInWithEmailLink } from 'firebase/auth';
import { auth } from '@/shared/firebase/config';
import { authApi } from '@/api/auth.api';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// Form states
const email = ref('');
const submittedEmail = ref('');
const errorMessage = ref('');
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
  errorMessage.value = '';

  try {
    // 1. Verificación previa de socio activo en la base de datos
    const validation = await authApi.validateEmail(targetEmail);
    if (!validation.exists || !validation.active) {
      errorMessage.value =
        'Este correo no está registrado como socio activo en el fondo. Contacta al administrador.';
      return;
    }

    // 2. Enviar Magic Link por Firebase Auth
    await authStore.sendMagicLink(targetEmail);
    submittedEmail.value = targetEmail;
    linkSent.value = true;
    startCooldown(60);
  } catch (e: any) {
    if (e.response?.status === 429) {
      errorMessage.value =
        'Demasiados intentos. Por favor, espere un momento antes de intentar de nuevo.';
    } else if (e.code === 'auth/invalid-email') {
      errorMessage.value = 'Formato de correo electrónico no válido.';
    } else {
      errorMessage.value = 'Ocurrió un error al enviar el enlace. Intente de nuevo.';
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
  errorMessage.value = '';
}

async function processLogin(targetEmail: string, url: string) {
  isVerifyingLink.value = true;
  errorMessage.value = '';

  try {
    await authStore.completeMagicLinkLogin(url, targetEmail);
    const redirect = (route.query.redirect as string) || '/home';
    router.push(redirect);
  } catch (e: any) {
    if (
      e.status === 401 ||
      (e.response && e.response.status === 401) ||
      e.message?.includes('401')
    ) {
      errorMessage.value =
        'Este correo no está registrado como socio activo en el fondo. Contacta al administrador.';
      await authStore.logout();
    } else if (
      e.code === 'auth/invalid-action-code' ||
      e.code === 'auth/expired-action-code'
    ) {
      errorMessage.value =
        'El enlace de acceso no es válido o ha expirado. Por favor, solicita uno nuevo.';
    } else if (e.message === 'El enlace no es válido o ha expirado.') {
      errorMessage.value = e.message;
    } else {
      errorMessage.value = 'Ocurrió un error al iniciar sesión. Intente de nuevo.';
      if (authStore.isAuthenticated) {
        await authStore.logout();
      }
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
      confirmError.value = 'Error al validar el correo electrónico. Intente de nuevo.';
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
      // Si se abrió en un navegador alternativo en el móvil, solicitar confirmación
      showConfirmEmailModal.value = true;
    }
  }
});
</script>

<template>
  <div class="space-y-6 w-full max-w-sm mx-auto">
    <!-- Estado: Verificando enlace mágico -->
    <div v-if="isVerifyingLink" class="text-center py-12 space-y-4">
      <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 mx-auto flex items-center justify-center animate-pulse">
        <svg class="w-8 h-8 animate-spin text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      </div>
      <h2 class="text-xl font-bold text-white tracking-tight">Verificando enlace...</h2>
      <p class="text-xs text-slate-400 max-w-xs mx-auto">
        Estamos comprobando tu enlace de acceso para iniciar sesión automáticamente.
      </p>
    </div>

    <!-- Estado: Enlace enviado ("Revisa tu correo") -->
    <div v-else-if="linkSent" class="space-y-6 text-center">
      <div class="space-y-2">
        <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/40">
          <Mail class="w-9 h-9" />
        </div>
        <h2 class="text-2xl font-black text-white tracking-tight">¡Revisa tu correo!</h2>
        <p class="text-xs text-slate-400">
          Hemos enviado un enlace mágico de acceso directo a:
        </p>
        <p class="font-semibold text-xs text-emerald-400 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl break-all inline-block">
          {{ submittedEmail }}
        </p>
      </div>

      <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-left space-y-2">
        <p class="text-xs text-slate-300 font-medium">¿Cómo ingresar?</p>
        <ol class="text-xs text-slate-400 list-decimal list-inside space-y-1">
          <li>Abre tu aplicación de correo o bandeja de entrada.</li>
          <li>Busca el mensaje enviado por Mi Fondo (revisa spam si no lo ves).</li>
          <li>Toca el enlace de acceso desde este dispositivo para ingresar directamente.</li>
        </ol>
      </div>

      <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 text-left">
        {{ errorMessage }}
      </div>

      <div class="space-y-3">
        <button
          type="button"
          :disabled="cooldown > 0 || loading"
          class="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950/60 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          @click="handleResend"
        >
          <Refresh class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          <span v-if="cooldown > 0">Reenviar enlace en {{ cooldown }}s</span>
          <span v-else>Reenviar enlace</span>
        </button>

        <button
          type="button"
          class="w-full py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          @click="resetForm"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Cambiar correo electrónico</span>
        </button>
      </div>
    </div>

    <!-- Estado: Formulario inicial de solicitud de enlace mágico -->
    <div v-else class="space-y-6">
      <!-- Brand / Header -->
      <div class="text-center space-y-2">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 mx-auto shadow-xl shadow-emerald-950/60 flex items-center justify-center">
          <div class="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h1 class="text-2xl font-black text-white tracking-tight">Mi Fondo</h1>
        <p class="text-xs text-slate-400">Portal exclusivo para socios</p>
      </div>

      <div class="text-center">
        <p class="text-xs text-slate-400">
          Ingresa tu correo electrónico registrado y te enviaremos un enlace mágico de acceso directo sin contraseña.
        </p>
      </div>

      <!-- Formulario -->
      <form class="space-y-4" @submit.prevent="handleSendMagicLink()">
        <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
          {{ errorMessage }}
        </div>

        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-300" for="email">Correo Electrónico</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            placeholder="socio@ejemplo.com"
            class="w-full py-2.5 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950/60 transition-all disabled:opacity-50 cursor-pointer"
        >
          <span v-if="loading">Enviando enlace...</span>
          <span v-else>Enviar Enlace Mágico</span>
        </button>
      </form>
    </div>

    <!-- Modal para confirmar correo (si se abrió en navegador distinto) -->
    <div
      v-if="showConfirmEmailModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div class="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
        <div class="space-y-1">
          <h3 class="text-base font-bold text-white">Confirmar Correo Electrónico</h3>
          <p class="text-xs text-slate-400">
            Parece que abriste el enlace en un navegador diferente. Por seguridad, por favor confirma tu correo electrónico.
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="handleConfirmEmailSubmit">
          <div v-if="confirmError" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            {{ confirmError }}
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-300" for="confirm-email">Correo Electrónico</label>
            <input
              id="confirm-email"
              v-model="confirmEmail"
              type="email"
              required
              autocomplete="email"
              placeholder="socio@ejemplo.com"
              class="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <div class="flex gap-2 pt-2">
            <button
              type="button"
              :disabled="confirmLoading"
              class="w-1/2 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer"
              @click="cancelConfirmModal"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="confirmLoading"
              class="w-1/2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              <span v-if="confirmLoading">Confirmando...</span>
              <span v-else>Confirmar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
