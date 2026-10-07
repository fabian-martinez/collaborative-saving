<!-- Copyright 2026 Collaborative Saving Project. All rights reserved. -->
<script setup lang="ts">
import { computed } from 'vue';
import { CreditCard } from 'iconoir-vue/regular';
import SummaryCard from '@/shared/components/ui/SummaryCard.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import Badge from '@/shared/components/ui/Badge.vue';
import type { Loan } from '@/api';

const props = withDefaults(
  defineProps<{
    totalDebt?: number;
    loans?: Loan[];
  }>(),
  {
    totalDebt: 0,
    loans: () => [],
  }
);

const emit = defineEmits<{
  (e: 'select-loan', loanId: string): void;
}>();

const badgeText = computed(() => {
  const count = props.loans.length;
  return `${count} ${count === 1 ? 'préstamo' : 'préstamos'}`;
});

function formatRate(rate: number): string {
  if (rate === undefined || rate === null) return '0.0%';
  const numRate = Number(rate);
  const pct = numRate <= 1 ? numRate * 100 : numRate;
  return `${pct.toFixed(1)}% mes`;
}
</script>

<template>
  <SummaryCard
    :icon="CreditCard"
    icon-color="amber"
    title="Mi Deuda"
    subtitle="Saldo pendiente de créditos"
    :badge-text="badgeText"
    badge-variant="warning"
    :amount="totalDebt"
    amount-label="Deuda total pendiente"
  >
    <!-- Empty State -->
    <div
      v-if="loans.length === 0"
      class="p-4 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] text-center text-xs text-slate-500 dark:text-slate-400"
    >
      No tienes créditos vigentes. ¡Estás libre de deudas!
    </div>

    <!-- Préstamos List -->
    <div
      v-for="loan in loans"
      :key="loan.id"
      class="p-4 rounded-2xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] hover:border-slate-300 dark:hover:border-[#22356a] active:scale-[0.99] transition-all cursor-pointer space-y-2"
      @click="emit('select-loan', loan.id)"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-xs font-semibold text-slate-900 dark:text-white truncate">
            {{ loan.loan_type }}
          </span>
          <Badge variant="info">{{ formatRate(loan.interest_rate) }}</Badge>
        </div>
        <AmountDisplay :amount="loan.outstanding_balance" size="sm" variant="default" />
      </div>

      <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/50 dark:border-[#152042]">
        <div class="inline-flex items-center gap-1">
          <span>Cuota mensual:</span>
          <AmountDisplay :amount="loan.monthly_payment_amount" size="xs" variant="default" />
        </div>
        <span class="text-emerald-600 dark:text-emerald-400 font-semibold">
          Al día (Ver detalle →)
        </span>
      </div>
    </div>
  </SummaryCard>
</template>
