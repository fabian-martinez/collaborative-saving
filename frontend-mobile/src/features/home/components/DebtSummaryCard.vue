<script setup lang="ts">
import { CreditCard } from 'iconoir-vue/regular';
import SummaryCard from '@/shared/components/ui/SummaryCard.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import Badge from '@/shared/components/ui/Badge.vue';

defineProps<{
  totalDebt?: number;
}>();

const emit = defineEmits<{
  (e: 'select-loan', loanId: string): void;
}>();
</script>

<template>
  <SummaryCard
    :icon="CreditCard"
    icon-color="amber"
    title="Mi Deuda"
    subtitle="Saldo pendiente de créditos"
    badge-text="2 préstamos"
    badge-variant="warning"
    :amount="totalDebt ?? 800000"
    amount-label="Deuda total pendiente"
  >
    <!-- Préstamo 1 -->
    <div
      class="p-4 rounded-2xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] hover:border-slate-300 dark:hover:border-[#22356a] active:scale-[0.99] transition-all cursor-pointer space-y-2"
      @click="emit('select-loan', 'loan-1')"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-xs font-semibold text-slate-900 dark:text-white truncate">Préstamo Corriente</span>
          <Badge variant="info">1.5% mes</Badge>
        </div>
        <AmountDisplay :amount="500000" size="sm" variant="default" />
      </div>
      <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/50 dark:border-[#152042]">
        <span>Cuota mensual: <strong class="text-slate-800 dark:text-slate-200 font-mono">$ 75.000</strong></span>
        <span class="text-emerald-600 dark:text-emerald-400 font-semibold">Al día (Ver tabla →)</span>
      </div>
    </div>

    <!-- Préstamo 2 -->
    <div
      class="p-4 rounded-2xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] hover:border-slate-300 dark:hover:border-[#22356a] active:scale-[0.99] transition-all cursor-pointer space-y-2"
      @click="emit('select-loan', 'loan-2')"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-xs font-semibold text-slate-900 dark:text-white truncate">Préstamo Ágil</span>
          <Badge variant="warning">2.0% mes</Badge>
        </div>
        <AmountDisplay :amount="300000" size="sm" variant="default" />
      </div>
      <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/50 dark:border-[#152042]">
        <span>Cuota mensual: <strong class="text-slate-800 dark:text-slate-200 font-mono">$ 35.000</strong></span>
        <span class="text-emerald-600 dark:text-emerald-400 font-semibold">Al día (Ver tabla →)</span>
      </div>
    </div>
  </SummaryCard>
</template>
