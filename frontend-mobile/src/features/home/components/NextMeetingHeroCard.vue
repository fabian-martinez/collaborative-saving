<script setup lang="ts">
import { ArrowRight, ClockRotateRight } from 'iconoir-vue/regular';
import SummaryCard from '@/shared/components/ui/SummaryCard.vue';

defineProps<{
  meetingDate?: string;
  totalDue?: number;
}>();

const emit = defineEmits<{
  (e: 'open-breakdown'): void;
  (e: 'view-history'): void;
}>();
</script>

<template>
  <SummaryCard
    highlighted
    title="Próxima Reunión"
    :amount="totalDue ?? 185000"
    amount-label="Total a pagar este mes"
  >
    <template #header-icon>
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </template>

    <template #amount-before>
      <div class="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
        {{ meetingDate || 'Sábado 15 de Octubre, 2026' }}
      </div>
    </template>

    <template #actions>
      <button
        type="button"
        class="flex-1 py-3 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/20"
        @click="emit('open-breakdown')"
      >
        <span>Ver desglose liquidación</span>
        <ArrowRight class="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        class="py-3 px-3.5 rounded-xl bg-slate-100 dark:bg-[#132044] hover:bg-slate-200 dark:hover:bg-[#1a2d5f] border border-slate-200 dark:border-[#22356d] active:scale-95 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
        title="Ver pagos anteriores"
        @click="emit('view-history')"
      >
        <ClockRotateRight class="w-4 h-4" />
        <span class="text-xs">Recibos</span>
      </button>
    </template>
  </SummaryCard>
</template>
