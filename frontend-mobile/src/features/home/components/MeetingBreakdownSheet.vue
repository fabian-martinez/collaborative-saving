<script setup lang="ts">
import BottomSheet from '@/shared/components/overlays/BottomSheet.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';

defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();
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
        <span class="text-sm font-bold text-slate-900 dark:text-white">Sábado, 15 de Octubre 2026</span>
      </div>

      <!-- Itemized Breakdown -->
      <div class="space-y-2">
        <h4 class="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Conceptos a pagar</h4>

        <!-- Acciones -->
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] gap-3">
          <div class="min-w-0">
            <span class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block truncate">Aporte a Acciones</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">3 Acciones Grandes + 5 Pequeñas</span>
          </div>
          <AmountDisplay :amount="50000" size="md" variant="default" />
        </div>

        <!-- Préstamo 1 -->
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] gap-3">
          <div class="min-w-0">
            <span class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block truncate">Préstamo Corriente</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">Abono: $ 60.000 + Interés: $ 15.000</span>
          </div>
          <AmountDisplay :amount="75000" size="md" variant="default" />
        </div>

        <!-- Préstamo 2 (Ágil) -->
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] gap-3">
          <div class="min-w-0">
            <span class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block truncate">Préstamo Ágil</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">Abono: $ 30.000 + Interés: $ 5.000</span>
          </div>
          <AmountDisplay :amount="35000" size="md" variant="default" />
        </div>

        <!-- Fondos especiales y solidaridad -->
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] gap-3">
          <div class="min-w-0">
            <span class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block truncate">Seguro de Cartera & Actividad</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">Solidaridad ($ 15.000) + Rifa ($ 10.000)</span>
          </div>
          <AmountDisplay :amount="25000" size="md" variant="default" />
        </div>
      </div>

      <!-- Total Box: Clean White/Dark Slate with elegant badge -->
      <div class="p-4 rounded-2xl bg-slate-100 dark:bg-[#0f1d44] border border-slate-200 dark:border-[#22356d] flex items-center justify-between gap-3">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Total a entregar</span>
          <span class="text-xs text-slate-500 dark:text-slate-400">En efectivo a tesorería</span>
        </div>
        <AmountDisplay :amount="185000" size="xl" variant="default" />
      </div>

      <!-- Projection note -->
      <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-[#081026] border border-slate-200/80 dark:border-[#17254e] text-xs text-slate-500 dark:text-slate-400">
        <div class="font-semibold text-slate-800 dark:text-slate-200 mb-0.5">ℹ️ Efecto contable tras el pago:</div>
        <div>Tu deuda total pasará de <strong class="text-slate-900 dark:text-slate-200">$ 800.000</strong> a <strong class="text-emerald-600 dark:text-emerald-400">$ 710.000</strong>.</div>
      </div>
    </div>
  </BottomSheet>
</template>
