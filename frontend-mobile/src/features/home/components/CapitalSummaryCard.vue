<!-- Copyright 2026 Collaborative Saving Project. All rights reserved. -->
<script setup lang="ts">
import { computed } from 'vue';
import { GraphUp } from 'iconoir-vue/regular';
import SummaryCard from '@/shared/components/ui/SummaryCard.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import type { GroupedStockHolding } from '../stores/memberPortalStore';

const props = withDefaults(
  defineProps<{
    totalCapital?: number;
    totalSharesCount?: number;
    groupedStocks?: GroupedStockHolding[];
  }>(),
  {
    totalCapital: 0,
    totalSharesCount: 0,
    groupedStocks: () => [],
  }
);

const badgeText = computed(() => {
  const count = props.totalSharesCount;
  return `${count} ${count === 1 ? 'acción' : 'acciones'}`;
});
</script>

<template>
  <SummaryCard
    :icon="GraphUp"
    icon-color="blue"
    title="Mi Capital"
    subtitle="Ahorro en acciones"
    :badge-text="badgeText"
    badge-variant="info"
    :amount="totalCapital"
    amount-label="Saldo total acumulado"
  >
    <!-- Empty State -->
    <div
      v-if="groupedStocks.length === 0"
      class="p-4 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] text-center text-xs text-slate-500 dark:text-slate-400"
    >
      No tienes acciones suscritas en este ciclo.
    </div>

    <!-- Items List (Agrupadas por tipo) -->
    <div
      v-for="stock in groupedStocks"
      :key="stock.stock_id"
      class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] gap-3"
    >
      <div class="min-w-0">
        <span class="text-xs font-semibold text-slate-900 dark:text-slate-200 block truncate">
          {{ stock.name }}
        </span>
        <span class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          {{ stock.quantity }} {{ stock.quantity === 1 ? 'acción suscrita' : 'acciones suscritas' }}
        </span>
      </div>
      <AmountDisplay :amount="stock.total_value" size="sm" variant="default" />
    </div>
  </SummaryCard>
</template>
