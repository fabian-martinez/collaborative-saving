<script setup lang="ts">
import Card from '@/shared/components/ui/Card.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';

defineProps<{
  totalCapital?: number;
}>();
</script>

<template>
  <Card class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="p-2 rounded-xl bg-blue-500/10 text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 class="text-xs uppercase font-bold text-slate-400 tracking-wider">Mi Capital</h3>
          <span class="text-xs text-slate-400">Ahorro acumulado en acciones</span>
        </div>
      </div>
      <AmountDisplay :amount="totalCapital ?? 2450000" size="xl" />
    </div>

    <!-- Items List (Acción Grande vs Pequeña) -->
    <div class="space-y-2 pt-2 border-t border-slate-800">
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
        <div>
          <span class="text-xs font-semibold text-slate-200 block">Acción Grande</span>
          <span class="text-[11px] text-slate-400 font-mono">3 acciones suscritas</span>
        </div>
        <AmountDisplay :amount="1500000" size="sm" />
      </div>

      <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
        <div>
          <span class="text-xs font-semibold text-slate-200 block">Acción Pequeña</span>
          <span class="text-[11px] text-slate-400 font-mono">5 acciones suscritas</span>
        </div>
        <AmountDisplay :amount="950000" size="sm" />
      </div>
    </div>
  </Card>
</template>
