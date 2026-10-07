<!-- Copyright 2026 Collaborative Saving Project. All rights reserved. -->
<script setup lang="ts">
import { computed } from 'vue';
import BottomSheet from '@/shared/components/overlays/BottomSheet.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import Badge from '@/shared/components/ui/Badge.vue';
import type { Loan } from '@/api';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    loan?: Loan | null;
  }>(),
  {
    loan: null,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const initialAmount = computed(() => {
  if (!props.loan) return 0;
  return Number(props.loan.approved_amount) || Number(props.loan.disbursed_amount) || 0;
});

const outstandingBalance = computed(() => {
  if (!props.loan) return 0;
  return Number(props.loan.outstanding_balance) || 0;
});

const amortizedAmount = computed(() => {
  return Math.max(0, initialAmount.value - outstandingBalance.value);
});

const progressPercent = computed(() => {
  if (initialAmount.value <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((amortizedAmount.value / initialAmount.value) * 100)));
});

const formattedRate = computed(() => {
  if (!props.loan) return '0.0% mensual';
  const r = Number(props.loan.interest_rate);
  const pct = r <= 1 ? r * 100 : r;
  return `${pct.toFixed(1)}% mensual`;
});

const principalQuota = computed(() => {
  if (!props.loan) return 0;
  return Number(props.loan.monthly_payment_amount) || 0;
});

const estimatedInterestQuota = computed(() => {
  if (!props.loan) return 0;
  const r = Number(props.loan.interest_rate);
  const rateFactor = r <= 1 ? r : r / 100;
  return Math.round(outstandingBalance.value * rateFactor);
});

const totalMeetingPayment = computed(() => {
  return principalQuota.value + estimatedInterestQuota.value;
});
</script>

<template>
  <BottomSheet
    :model-value="modelValue"
    title="Detalle del Crédito"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="loan" class="space-y-4">
      <!-- Balance Header -->
      <div class="p-4 rounded-2xl bg-slate-50 dark:bg-[#091129] border border-slate-200 dark:border-[#17254e] text-center">
        <span class="text-xs text-slate-500 dark:text-slate-400 block mb-1">
          Saldo pendiente por pagar
        </span>
        <AmountDisplay :amount="outstandingBalance" size="xl" variant="default" />

        <!-- Progress Bar -->
        <div class="mt-3.5">
          <div class="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>Progreso de amortización ({{ progressPercent }}%)</span>
            <div class="inline-flex items-center gap-1">
              <span>Monto inicial:</span>
              <AmountDisplay :amount="initialAmount" size="xs" variant="muted" />
            </div>
          </div>
          <div class="w-full h-2.5 rounded-full bg-slate-200 dark:bg-[#15234c] overflow-hidden">
            <div
              class="h-full bg-emerald-500 rounded-full transition-all duration-300"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
        </div>
      </div>

      <!-- Loan Parameters -->
      <div class="grid grid-cols-2 gap-2.5">
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/80 dark:border-[#17254e]">
          <span class="text-[11px] text-slate-500 dark:text-slate-400 block">Tasa de Interés</span>
          <span class="text-sm font-bold text-slate-900 dark:text-white">{{ formattedRate }}</span>
        </div>
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/80 dark:border-[#17254e]">
          <span class="text-[11px] text-slate-500 dark:text-slate-400 block">Modalidad</span>
          <Badge variant="info">{{ loan.loan_type }}</Badge>
        </div>
      </div>

      <!-- Projection Table -->
      <div class="space-y-2">
        <h4 class="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
          Proyección de la próxima cuota
        </h4>
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/80 dark:border-[#17254e] space-y-2 text-xs">
          <div class="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>Abono programado a capital:</span>
            <AmountDisplay :amount="principalQuota" size="sm" variant="default" />
          </div>
          <div class="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>Interés mensual estimado:</span>
            <AmountDisplay :amount="estimatedInterestQuota" size="sm" variant="default" />
          </div>
          <div class="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center font-bold text-slate-900 dark:text-white">
            <span>Cuota total a pagar en reunión:</span>
            <AmountDisplay :amount="totalMeetingPayment" size="sm" variant="default" />
          </div>
        </div>
      </div>
    </div>
  </BottomSheet>
</template>
