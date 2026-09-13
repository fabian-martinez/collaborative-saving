<script setup lang="ts">
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
  <Card class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="p-2 rounded-xl bg-rose-500/10 text-rose-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <div>
          <h3 class="text-xs uppercase font-bold text-slate-400 tracking-wider">Mi Deuda</h3>
          <span class="text-xs text-slate-400">Saldo pendiente de créditos</span>
        </div>
      </div>
      <AmountDisplay :amount="totalDebt ?? 800000" size="xl" variant="danger" />
    </div>

    <!-- Active Loans List -->
    <div class="space-y-2 pt-2 border-t border-slate-800">
      <!-- Préstamo 1 -->
      <div
        class="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700 active:scale-[0.99] transition-all cursor-pointer"
        @click="emit('select-loan', 'loan-1')"
      >
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-white">Préstamo Corriente</span>
            <Badge variant="info">1.5% mes</Badge>
          </div>
          <AmountDisplay :amount="500000" size="sm" variant="danger" />
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-400">
          <span>Cuota mensual: <strong class="text-slate-300">$ 75.000</strong></span>
          <span class="text-emerald-400 font-medium">Al día</span>
        </div>
      </div>

      <!-- Préstamo 2 -->
      <div
        class="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700 active:scale-[0.99] transition-all cursor-pointer"
        @click="emit('select-loan', 'loan-2')"
      >
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-white">Préstamo Ágil</span>
            <Badge variant="warning">2.0% mes</Badge>
          </div>
          <AmountDisplay :amount="300000" size="sm" variant="danger" />
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-400">
          <span>Cuota mensual: <strong class="text-slate-300">$ 35.000</strong></span>
          <span class="text-emerald-400 font-medium">Al día</span>
        </div>
      </div>
    </div>
  </Card>
</template>
