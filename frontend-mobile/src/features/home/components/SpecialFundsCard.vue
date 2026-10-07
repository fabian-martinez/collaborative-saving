<!-- Copyright 2026 Collaborative Saving Project. All rights reserved. -->
<script setup lang="ts">
import { computed } from 'vue';
import { ShieldCheck } from 'iconoir-vue/regular';
import SummaryCard from '@/shared/components/ui/SummaryCard.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import type { MemberDue } from '@/api';

const props = withDefaults(
  defineProps<{
    funds?: MemberDue[];
    totalFunds?: number;
  }>(),
  {
    funds: () => [],
    totalFunds: 0,
  }
);

const badgeText = computed(() => {
  const count = props.funds.length;
  return `${count} ${count === 1 ? 'fondo' : 'fondos'}`;
});
</script>

<template>
  <SummaryCard
    :icon="ShieldCheck"
    icon-color="purple"
    title="Fondos & Actividades"
    subtitle="Solidaridad y aportes comunitarios"
    :badge-text="badgeText"
    badge-variant="info"
    :amount="totalFunds"
    amount-label="Total aportes especiales"
  >
    <!-- Empty State -->
    <div
      v-if="funds.length === 0"
      class="p-4 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] text-center text-xs text-slate-500 dark:text-slate-400"
    >
      No tienes aportes a fondos especiales pendientes.
    </div>

    <!-- Funds Grid -->
    <div v-else class="grid grid-cols-2 gap-2.5">
      <div
        v-for="(fund, index) in funds"
        :key="fund.reference_id || `fund-${index}`"
        class="p-3.5 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e]"
      >
        <span class="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-medium truncate">
          {{ fund.description || 'Fondo Comunitario' }}
        </span>
        <AmountDisplay :amount="fund.amount" size="sm" variant="default" />
      </div>
    </div>
  </SummaryCard>
</template>
