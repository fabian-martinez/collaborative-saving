<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false);

async function handleLogin() {
  errorMessage.value = '';
  loading.value = true;
  try {
    await authStore.login(email.value, password.value);
    router.push('/home');
  } catch (error: any) {
    errorMessage.value = error?.message || 'Error al iniciar sesión. Revisa tu correo y contraseña.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
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

    <!-- Form -->
    <form class="space-y-4" @submit.prevent="handleLogin">
      <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
        {{ errorMessage }}
      </div>

      <div class="space-y-1">
        <label class="text-xs font-semibold text-slate-300">Correo Electrónico</label>
        <input
          v-model="email"
          type="email"
          required
          placeholder="tu.correo@ejemplo.com"
          class="w-full py-2.5 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
        />
      </div>

      <div class="space-y-1">
        <label class="text-xs font-semibold text-slate-300">Contraseña</label>
        <input
          v-model="password"
          type="password"
          required
          placeholder="••••••••"
          class="w-full py-2.5 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
        />
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950/60 transition-all disabled:opacity-50"
      >
        <span v-if="loading">Ingresando...</span>
        <span v-else>Iniciar Sesión</span>
      </button>
    </form>
  </div>
</template>
