<script setup lang="ts">
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode';
import { useAuthStore } from '@/features/auth/stores/authStore';

const { isHidden, togglePrivacy } = usePrivacyMode();
const authStore = useAuthStore();
</script>

<template>
  <header class="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 pt-safe px-4 pb-3">
    <div class="flex items-center justify-between">
      <!-- User Info & Greeting -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-950/50">
          <div class="w-full h-full bg-slate-900 rounded-full flex items-center justify-center font-bold text-emerald-400 text-sm">
            {{ authStore.memberProfile?.name?.[0] || 'S' }}
          </div>
        </div>
        <div>
          <span class="text-xs text-slate-400 block font-medium">Bienvenido</span>
          <h2 class="text-sm font-bold text-white tracking-tight line-clamp-1">
            {{ authStore.memberProfile?.name || 'Socio' }}
          </h2>
        </div>
      </div>

      <!-- Right Action: Privacy Toggle -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 active:scale-95 transition-all hover:border-slate-700"
          :class="{ 'border-emerald-500/30 text-emerald-400': !isHidden }"
          :title="isHidden ? 'Mostrar saldos' : 'Ocultar saldos'"
          @click="togglePrivacy"
        >
          <!-- Eye Icon -->
          <svg v-if="!isHidden" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <!-- Eye Off Icon -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
          </svg>
          <span>{{ isHidden ? 'Mostrar' : 'Ocultar' }}</span>
        </button>
      </div>
    </div>
  </header>
</template>
