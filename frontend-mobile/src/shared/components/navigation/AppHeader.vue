<script setup lang="ts">
import { Eye, EyeClosed, SunLight, HalfMoon } from 'iconoir-vue/regular';
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode';
import { useThemeMode } from '@/shared/composables/useThemeMode';
import { useAuthStore } from '@/features/auth/stores/authStore';

const { isHidden, togglePrivacy } = usePrivacyMode();
const { isDark, toggleTheme } = useThemeMode();
const authStore = useAuthStore();
</script>

<template>
  <header class="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#080e22]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-[#162348] pt-safe px-4.5 sm:px-5 pb-3 transition-colors duration-200">
    <div class="flex items-center justify-between">
      <!-- User Info & Greeting -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-sm shadow-emerald-500/20">
          <div class="w-full h-full bg-slate-100 dark:bg-[#0e1838] rounded-full flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400 text-sm">
            {{ authStore.memberProfile?.name?.[0] || 'S' }}
          </div>
        </div>
        <div>
          <span class="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Bienvenido</span>
          <h2 class="text-sm font-bold text-slate-900 dark:text-white tracking-tight line-clamp-1">
            {{ authStore.memberProfile?.name || 'Socio' }}
          </h2>
        </div>
      </div>

      <!-- Right Actions: Theme Toggle + Privacy Toggle -->
      <div class="flex items-center gap-2">
        <!-- Theme Toggle (Modo Luminoso / Oscuro) -->
        <button
          type="button"
          class="p-2 rounded-full bg-slate-100 dark:bg-[#0e1838] border border-slate-200 dark:border-[#1a2750] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#2b3e7a] active:scale-95 transition-all"
          :title="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          @click="toggleTheme"
        >
          <SunLight v-if="isDark" class="w-4 h-4 text-amber-400" />
          <HalfMoon v-else class="w-4 h-4 text-slate-700" />
        </button>

        <!-- Master Privacy Toggle -->
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#0e1838] border border-slate-200 dark:border-[#1a2750] text-xs font-semibold text-slate-700 dark:text-slate-300 active:scale-95 transition-all hover:border-slate-300 dark:hover:border-[#2b3e7a]"
          :class="{ '!border-emerald-500/40 text-emerald-600 dark:text-emerald-400': !isHidden }"
          :title="isHidden ? 'Mostrar saldos' : 'Ocultar saldos'"
          @click="togglePrivacy"
        >
          <Eye v-if="!isHidden" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <EyeClosed v-else class="w-4 h-4 text-slate-400" />
          <span>{{ isHidden ? 'Mostrar' : 'Ocultar' }}</span>
        </button>
      </div>
    </div>
  </header>
</template>
