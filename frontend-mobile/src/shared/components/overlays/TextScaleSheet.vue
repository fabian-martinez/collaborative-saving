<script setup lang="ts">
import BottomSheet from './BottomSheet.vue';
import { useTextScale, type TextScaleLevel } from '@/shared/composables/useTextScale';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import Badge from '@/shared/components/ui/Badge.vue';

const {
  currentScale,
  isScaled,
  isScaleSheetOpen,
  options,
  setScale,
  stepUp,
  stepDown,
  resetScale,
  closeScaleSheet
} = useTextScale();

const scaleLabels: Record<TextScaleLevel, string> = {
  100: '100% Estándar',
  115: '115% Cómodo',
  130: '130% Grande',
  145: '145% Muy Grande'
};
</script>

<template>
  <BottomSheet
    v-model="isScaleSheetOpen"
    title="Tamaño de Texto y Zoom"
  >
    <div class="space-y-4">
      <!-- Stepper Controls -->
      <div class="p-4 rounded-2xl bg-slate-50 dark:bg-[#091129] border border-slate-200 dark:border-[#17254e] flex items-center justify-between gap-4">
        <div>
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Nivel de aumento</span>
          <span class="text-lg font-black text-slate-900 dark:text-white font-mono">{{ currentScale }}%</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="w-10 h-10 rounded-xl bg-white dark:bg-[#121e42] border border-slate-200 dark:border-[#1f3264] text-slate-800 dark:text-slate-200 font-bold text-lg flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
            :disabled="currentScale <= options[0]"
            title="Reducir letra"
            @click="stepDown"
          >
            −
          </button>
          <button
            type="button"
            class="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg flex items-center justify-center active:scale-90 transition-all disabled:opacity-30 shadow-sm"
            :disabled="currentScale >= options[options.length - 1]"
            title="Aumentar letra"
            @click="stepUp"
          >
            +
          </button>
        </div>
      </div>

      <!-- Quick Preset Chips (7 options) -->
      <div>
        <label class="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-2">
          Opciones rápidas de tamaño ({{ options.length }} niveles)
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            v-for="opt in options"
            :key="opt"
            type="button"
            class="py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all active:scale-95 text-left flex items-center justify-between"
            :class="currentScale === opt
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold border-emerald-600 dark:border-emerald-500 shadow-sm'
              : 'bg-slate-50 dark:bg-[#091129] border-slate-200 dark:border-[#17254e] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#22356a]'"
            @click="setScale(opt)"
          >
            <span>{{ scaleLabels[opt] }}</span>
            <span v-if="currentScale === opt" class="text-xs">✓</span>
          </button>
        </div>
      </div>

      <!-- Live Preview Card -->
      <div class="p-3.5 rounded-2xl bg-white dark:bg-[#080e22] border border-slate-200 dark:border-[#17254e] space-y-2">
        <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Vista previa en vivo</span>
        <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0e1838] border border-slate-200/80 dark:border-[#17254e]">
          <div class="min-w-0">
            <span class="text-xs font-semibold text-slate-900 dark:text-white block truncate">Ahorro en Acciones</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">8 acciones suscritas</span>
          </div>
          <div class="flex flex-col items-end shrink-0 gap-1">
            <AmountDisplay :amount="2450000" size="sm" variant="default" />
            <Badge variant="success" class="!text-[10px] !py-0.5 !px-2">Al día</Badge>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2.5 pt-2">
        <button
          v-if="isScaled"
          type="button"
          class="py-3 px-4 rounded-xl bg-slate-100 dark:bg-[#132044] hover:bg-slate-200 dark:hover:bg-[#1a2d5f] border border-slate-200 dark:border-[#22356d] text-slate-700 dark:text-slate-200 text-xs font-semibold active:scale-95 transition-all"
          @click="resetScale"
        >
          Restablecer a 100%
        </button>

        <button
          type="button"
          class="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center transition-all shadow-sm"
          @click="closeScaleSheet"
        >
          Guardar y Cerrar
        </button>
      </div>
    </div>
  </BottomSheet>
</template>
