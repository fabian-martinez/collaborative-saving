<script setup lang="ts">
import { GraphUp } from 'iconoir-vue/regular';
import SummaryCard from '@/shared/components/ui/SummaryCard.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';

defineProps<{
  totalCapital?: number;
}>();
</script>

<template>
  <SummaryCard
    :icon="GraphUp"
    icon-color="blue"
    title="Mi Capital"
    subtitle="Ahorro en acciones"
    badge-text="8 acciones"
    badge-variant="info"
    :amount="totalCapital ?? 2450000"
    amount-label="Saldo total acumulado"
  >
    <!-- Items List (Acción Grande vs Pequeña) -->
    <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] gap-3">
      <div class="min-w-0">
        <span class="text-xs font-semibold text-slate-900 dark:text-slate-200 block truncate">Acción Grande</span>
        <span class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">3 acciones suscritas</span>
      </div>
      <AmountDisplay :amount="1500000" size="sm" variant="default" />
    </div>

    <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] gap-3">
      <div class="min-w-0">
        <span class="text-xs font-semibold text-slate-900 dark:text-slate-200 block truncate">Acción Pequeña</span>
        <span class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">5 acciones suscritas</span>
      </div>
      <AmountDisplay :amount="950000" size="sm" variant="default" />
    </div>
  </SummaryCard>
</template>
