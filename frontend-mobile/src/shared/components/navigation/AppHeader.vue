<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  Eye,
  EyeClosed,
  SunLight,
  HalfMoon,
  NavArrowDown,
  Xmark,
  Check,
  TextSize
} from 'iconoir-vue/regular';
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode';
import { useThemeMode } from '@/shared/composables/useThemeMode';
import { useTextScale, type TextScaleLevel } from '@/shared/composables/useTextScale';
import { useAuthStore } from '@/features/auth/stores/authStore';

const { isHidden, togglePrivacy } = usePrivacyMode();
const { isDark, setTheme } = useThemeMode();
const { currentScale, setScale, options } = useTextScale();
const authStore = useAuthStore();

const isUserMenuOpen = ref(false);

const scaleLabels: Record<TextScaleLevel, string> = {
  100: '100% Estándar',
  115: '115% Cómodo',
  130: '130% Grande',
  145: '145% Muy Grande'
};

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value;
}

function closeUserMenu() {
  isUserMenuOpen.value = false;
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isUserMenuOpen.value) {
    closeUserMenu();
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown);
  }
});
</script>

<template>
  <header class="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#080e22]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-[#162348] pt-safe px-4.5 sm:px-5 pb-3 transition-colors duration-200">
    <div class="flex items-center justify-between">
      <!-- User Info & Greeting (Clic abre menú de preferencias del socio) -->
      <div class="relative min-w-0">
        <button
          type="button"
          class="flex items-center gap-2.5 min-w-0 text-left p-1 -m-1 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-[#0e1838]/80 active:scale-[0.98] transition-all cursor-pointer group"
          :aria-expanded="isUserMenuOpen"
          aria-label="Preferencias del socio"
          @click="toggleUserMenu"
        >
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-sm shadow-emerald-500/20 shrink-0">
            <div class="w-full h-full bg-slate-100 dark:bg-[#0e1838] rounded-full flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {{ authStore.memberProfile?.name?.[0] || 'C' }}
            </div>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1">
              <span class="text-[11px] text-slate-500 dark:text-slate-400 block font-medium leading-none">Bienvenido</span>
              <NavArrowDown
                class="w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200"
                :class="{ 'rotate-180': isUserMenuOpen }"
              />
            </div>
            <h2 class="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate leading-tight mt-0.5">
              {{ authStore.memberProfile?.name || 'Carlos Martínez' }}
            </h2>
          </div>
        </button>

        <!-- Backdrop para cerrar popover al hacer clic fuera -->
        <div
          v-if="isUserMenuOpen"
          class="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] transition-opacity"
          @click="closeUserMenu"
        />

        <!-- Menú Flotante de Preferencias del Socio -->
        <transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="transform scale-95 opacity-0 -translate-y-2"
          enter-to-class="transform scale-100 opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="transform scale-100 opacity-100 translate-y-0"
          leave-to-class="transform scale-95 opacity-0 -translate-y-2"
        >
          <div
            v-if="isUserMenuOpen"
            class="absolute top-full left-0 mt-2 z-50 w-[min(calc(100vw-2.5rem),20rem)] rounded-2xl bg-white dark:bg-[#0c1532] border border-slate-200 dark:border-[#1a2750] shadow-2xl p-4 space-y-4"
            role="dialog"
            aria-label="Preferencias del socio"
          >
            <!-- Header del Menú -->
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#162348]">
              <div class="min-w-0">
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Preferencias del Socio</span>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {{ authStore.memberProfile?.name || 'Carlos Martínez' }}
                </h3>
              </div>
              <button
                type="button"
                class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#152248] transition-colors cursor-pointer"
                aria-label="Cerrar preferencias"
                @click="closeUserMenu"
              >
                <Xmark class="w-4 h-4" />
              </button>
            </div>

            <!-- Opción 1: Tamaño de Fuente / Tipografía -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <TextSize class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Tamaño de fuente</span>
                </div>
                <span class="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {{ currentScale }}%
                </span>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Aumenta el tamaño tipográfico según tu comodidad (hasta 145%).
              </p>

              <!-- Opciones de Escala (4 niveles) -->
              <div class="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  v-for="opt in options"
                  :key="opt"
                  type="button"
                  class="p-2 rounded-xl border text-xs font-semibold transition-all active:scale-95 flex items-center justify-between cursor-pointer"
                  :class="currentScale === opt
                    ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#091129] border-slate-200 dark:border-[#17254e] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#22356a]'"
                  @click="setScale(opt)"
                >
                  <span>{{ scaleLabels[opt] }}</span>
                  <Check v-if="currentScale === opt" class="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>

            <!-- Opción 2: Modo de pantalla (Luminoso / Oscuro) -->
            <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-[#162348]">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <SunLight v-if="!isDark" class="w-4 h-4 text-amber-500" />
                <HalfMoon v-else class="w-4 h-4 text-indigo-400" />
                <span>Modo de pantalla</span>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Elige la apariencia que mejor se adapte a tu entorno.
              </p>

              <!-- Toggle Claro / Oscuro -->
              <div class="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  :class="!isDark
                    ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-bold shadow-sm'
                    : 'bg-slate-50 dark:bg-[#091129] border-slate-200 dark:border-[#17254e] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-[#22356a]'"
                  @click="setTheme(false)"
                >
                  <SunLight class="w-4 h-4 text-amber-500" />
                  <span>Claro</span>
                  <Check v-if="!isDark" class="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  :class="isDark
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                    : 'bg-slate-50 dark:bg-[#091129] border-slate-200 dark:border-[#17254e] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-[#22356a]'"
                  @click="setTheme(true)"
                >
                  <HalfMoon class="w-4 h-4 text-indigo-400" />
                  <span>Oscuro</span>
                  <Check v-if="isDark" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Footer con nota -->
            <div class="pt-1 text-center">
              <span class="text-[10px] text-slate-400 dark:text-slate-500">
                Tus preferencias se guardan en este dispositivo
              </span>
            </div>
          </div>
        </transition>
      </div>

      <!-- Right Action: Master Privacy Toggle -->
      <div class="flex items-center shrink-0">
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#0e1838] border border-slate-200 dark:border-[#1a2750] text-xs font-semibold text-slate-700 dark:text-slate-300 active:scale-95 transition-all hover:border-slate-300 dark:hover:border-[#2b3e7a] cursor-pointer"
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
