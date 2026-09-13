<script setup lang="ts">
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
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span class="text-xs uppercase tracking-wider font-bold text-emerald-400">Próxima Reunión</span>
      </div>
      <Badge variant="warning">Efectivo en vivo</Badge>
    </div>

    <div class="text-xs text-slate-400 font-medium mb-1">
      {{ meetingDate || 'Sábado 15 de Octubre, 2026' }}
    </div>

    <div class="my-3">
      <div class="text-xs text-slate-400">Total a pagar este mes</div>
      <AmountDisplay :amount="totalDue ?? 185000" size="hero" variant="success" />
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center gap-2 pt-2 border-t border-slate-800/80">
      <button
        type="button"
        class="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/40"
        @click="emit('open-breakdown')"
      >
        <span>Ver desglose de liquidación</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <button
        type="button"
        class="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-300 font-semibold text-xs flex items-center gap-1 transition-all"
        title="Ver pagos anteriores"
        @click="emit('view-history')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="hidden sm:inline">Anteriores</span>
      </button>
    </div>
  </Card>
</template>
