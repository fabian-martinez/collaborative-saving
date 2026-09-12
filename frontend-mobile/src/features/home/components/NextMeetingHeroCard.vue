<script setup lang="ts">
import { ArrowRight, ClockRotateRight } from 'iconoir-vue/regular';
import Card from '@/shared/components/ui/Card.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import Badge from '@/shared/components/ui/Badge.vue';

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
  <Card highlighted class="relative overflow-hidden">
    <!-- Background glow decoration -->
    <div class="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span class="text-xs uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">Próxima Reunión</span>
      </div>
      <Badge variant="warning">Efectivo en vivo</Badge>
    </div>

    <div class="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
      {{ meetingDate || 'Sábado 15 de Octubre, 2026' }}
    </div>

    <!-- Main Number in Pure White (Dark) / Dark Slate (Light) to avoid eye strain -->
    <div class="my-3">
      <div class="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Total a pagar este mes</div>
      <AmountDisplay :amount="totalDue ?? 185000" size="hero" variant="default" />
    </div>

    <!-- Action Buttons with Iconoir -->
    <div class="flex items-center gap-2.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80">
      <button
        type="button"
        class="flex-1 py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/20"
        @click="emit('open-breakdown')"
      >
        <span>Ver desglose de liquidación</span>
        <ArrowRight class="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        class="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#132044] hover:bg-slate-200 dark:hover:bg-[#1a2d5f] border border-slate-200 dark:border-[#22356d] active:scale-95 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
        title="Ver pagos anteriores"
        @click="emit('view-history')"
      >
        <ClockRotateRight class="w-4 h-4" />
        <span class="text-xs">Recibos</span>
      </button>
    </div>
  </Card>
</template>
