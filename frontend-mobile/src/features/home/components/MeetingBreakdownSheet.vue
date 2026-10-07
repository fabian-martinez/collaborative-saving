<!-- Copyright 2026 Collaborative Saving Project. All rights reserved. -->
<script setup lang="ts">
import { computed } from 'vue';
import BottomSheet from '@/shared/components/overlays/BottomSheet.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import type { MemberDue } from '@/api';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    dues?: MemberDue[];
    meetingDate?: string | null;
    currentDebt?: number;
  }>(),
  {
    dues: () => [],
    meetingDate: null,
    currentDebt: 0,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const stockDues = computed(() => {
  return props.dues.filter((d) => d.type === 'stock_fee');
});

const loanDues = computed(() => {
  return props.dues.filter((d) => d.type === 'loan_payment');
});

const mandatoryDues = computed(() => {
  return props.dues.filter((d) => d.type === 'mandatory_contribution');
});

const otherDues = computed(() => {
  return props.dues.filter(
    (d) =>
      d.type !== 'stock_fee' &&
      d.type !== 'loan_payment' &&
      d.type !== 'mandatory_contribution'
  );
});

const totalDue = computed(() => {
  return props.dues.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
});

const totalPrincipalReduction = computed(() => {
  return loanDues.value.reduce(
    (sum, d) => sum + (Number(d.details?.principal) || 0),
    0
  );
});

const projectedDebt = computed(() => {
  return Math.max(0, props.currentDebt - totalPrincipalReduction.value);
});
</script>

<template>
  <BottomSheet
    :model-value="modelValue"
    title="Liquidación de Reunión"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/80 dark:border-[#17254e]">
        <span class="text-xs text-slate-500 dark:text-slate-400 block">Fecha de la asamblea</span>
        <span class="text-sm font-bold text-slate-900 dark:text-white">
          {{ meetingDate || 'Asamblea en curso' }}
        </span>
      </div>

      <!-- Itemized Breakdown -->
      <div class="space-y-2">
        <h4 class="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
          Conceptos a pagar
        </h4>

        <!-- Empty State -->
        <div
          v-if="dues.length === 0"
          class="p-4 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] text-center text-xs text-slate-500 dark:text-slate-400"
        >
          No tienes cuotas u obligaciones pendientes para esta reunión.
        </div>

        <!-- Acciones -->
        <div
          v-for="(due, index) in stockDues"
          :key="`stock-${index}`"
          class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] gap-3"
        >
          <div class="min-w-0">
            <span class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block truncate">
              {{ due.description || 'Aporte a Acciones' }}
            </span>
            <span v-if="due.stock_quantity" class="text-[11px] text-slate-500 dark:text-slate-400">
              {{ due.stock_quantity }} {{ due.stock_quantity === 1 ? 'acción suscrita' : 'acciones suscritas' }}
            </span>
          </div>
          <AmountDisplay :amount="due.amount" size="md" variant="default" />
        </div>

        <!-- Préstamos (con desglose de capital e intereses) -->
        <div
          v-for="(due, index) in loanDues"
          :key="`loan-${index}`"
          class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] gap-3"
        >
          <div class="min-w-0">
            <span class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block truncate">
              {{ due.description || 'Cuota de Préstamo' }}
            </span>
            <span v-if="due.details" class="text-[11px] text-slate-500 dark:text-slate-400 inline-flex flex-wrap gap-1 items-center">
              <span>Abono:</span>
              <AmountDisplay :amount="due.details.principal" size="xs" variant="muted" />
              <span>+ Interés:</span>
              <AmountDisplay :amount="due.details.interest" size="xs" variant="muted" />
            </span>
          </div>
          <AmountDisplay :amount="due.amount" size="md" variant="default" />
        </div>

        <!-- Fondos Especiales y Contribuciones Obligatorias -->
        <div
          v-for="(due, index) in mandatoryDues"
          :key="`mandatory-${index}`"
          class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] gap-3"
        >
          <div class="min-w-0">
            <span class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block truncate">
              {{ due.description || 'Fondo Solidario / Seguro' }}
            </span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">
              Aporte obligatorio del mes
            </span>
          </div>
          <AmountDisplay :amount="due.amount" size="md" variant="default" />
        </div>

        <!-- Otros conceptos -->
        <div
          v-for="(due, index) in otherDues"
          :key="`other-${index}`"
          class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] gap-3"
        >
          <div class="min-w-0">
            <span class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block truncate">
              {{ due.description || 'Otro concepto' }}
            </span>
          </div>
          <AmountDisplay :amount="due.amount" size="md" variant="default" />
        </div>
      </div>

      <!-- Total Box -->
      <div class="p-4 rounded-2xl bg-slate-100 dark:bg-[#0f1d44] border border-slate-200 dark:border-[#22356d] flex items-center justify-between gap-3">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Total a entregar
          </span>
          <span class="text-xs text-slate-500 dark:text-slate-400">
            En efectivo a tesorería
          </span>
        </div>
        <AmountDisplay :amount="totalDue" size="xl" variant="default" />
      </div>

      <!-- Projection note -->
      <div
        v-if="currentDebt > 0 && totalPrincipalReduction > 0"
        class="p-3.5 rounded-xl bg-slate-50 dark:bg-[#081026] border border-slate-200/80 dark:border-[#17254e] text-xs text-slate-500 dark:text-slate-400"
      >
        <div class="font-semibold text-slate-800 dark:text-slate-200 mb-0.5">ℹ️ Efecto contable tras el pago:</div>
        <div class="flex items-center flex-wrap gap-1">
          <span>Tu deuda total pasará de</span>
          <AmountDisplay :amount="currentDebt" size="xs" variant="default" />
          <span>a</span>
          <AmountDisplay :amount="projectedDebt" size="xs" variant="success" />.
        </div>
      </div>
    </div>
  </BottomSheet>
</template>
