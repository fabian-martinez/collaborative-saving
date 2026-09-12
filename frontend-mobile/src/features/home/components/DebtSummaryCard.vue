<script setup lang="ts">
import { CreditCard } from 'iconoir-vue/regular';
import Card from '@/shared/components/ui/Card.vue';
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
  <Card class="space-y-3.5">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
          <CreditCard class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <h3 class="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Mi Deuda</h3>
          <span class="text-xs text-slate-500 dark:text-slate-400 truncate block">Saldo pendiente de créditos</span>
        </div>
      </div>
      <!-- Primary number in clean white / dark slate with subtle badge -->
      <div class="text-right shrink-0">
        <AmountDisplay :amount="totalDebt ?? 800000" size="lg" variant="default" />
      </div>
    </div>

    <!-- Active Loans List -->
    <div class="space-y-2 pt-2 border-t border-slate-200/80 dark:border-[#17254e]">
      <!-- Préstamo 1 -->
      <div
        class="p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] hover:border-slate-300 dark:hover:border-[#22356a] active:scale-[0.99] transition-all cursor-pointer"
        @click="emit('select-loan', 'loan-1')"
      >
        <div class="flex items-center justify-between mb-1.5 gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-xs font-semibold text-slate-900 dark:text-white truncate">Préstamo Corriente</span>
            <Badge variant="info">1.5% mes</Badge>
          </div>
          <AmountDisplay :amount="500000" size="sm" variant="default" />
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Cuota mensual: <strong class="text-slate-800 dark:text-slate-200">$ 75.000</strong></span>
          <span class="text-emerald-600 dark:text-emerald-400 font-semibold">Al día (Ver tabla →)</span>
        </div>
      </div>

      <!-- Préstamo 2 -->
      <div
        class="p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] hover:border-slate-300 dark:hover:border-[#22356a] active:scale-[0.99] transition-all cursor-pointer"
        @click="emit('select-loan', 'loan-2')"
      >
        <div class="flex items-center justify-between mb-1.5 gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-xs font-semibold text-slate-900 dark:text-white truncate">Préstamo Ágil</span>
            <Badge variant="warning">2.0% mes</Badge>
          </div>
          <AmountDisplay :amount="300000" size="sm" variant="default" />
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Cuota mensual: <strong class="text-slate-800 dark:text-slate-200">$ 35.000</strong></span>
          <span class="text-emerald-600 dark:text-emerald-400 font-semibold">Al día (Ver tabla →)</span>
        </div>
      </div>
    </div>
  </Card>
</template>
