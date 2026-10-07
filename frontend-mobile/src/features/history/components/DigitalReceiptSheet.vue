<!-- Copyright 2026 Collaborative Saving Project. All rights reserved. -->
<script setup lang="ts">
import { computed } from 'vue';
import { Check } from 'iconoir-vue/regular';
import BottomSheet from '@/shared/components/overlays/BottomSheet.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import Badge from '@/shared/components/ui/Badge.vue';
import type { MemberPayment } from '@/api';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    receipt?: MemberPayment | null;
  }>(),
  {
    receipt: null,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const formattedDate = computed(() => {
  if (!props.receipt?.date) return '';
  try {
    const d = new Date(props.receipt.date);
    return d.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(props.receipt.date);
  }
});
</script>

<template>
  <BottomSheet
    :model-value="modelValue"
    title="Comprobante Digital de Pago"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="receipt" class="space-y-4">
      <!-- Receipt Header Badge -->
      <div class="text-center p-4 rounded-2xl bg-slate-50 dark:bg-[#091129] border border-slate-200 dark:border-[#17254e]">
        <div class="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2">
          <Check class="w-6 h-6" />
        </div>
        <Badge variant="success" class="mb-1">Efectivo Recibido y Asentado</Badge>
        <h3 class="text-lg font-bold text-slate-900 dark:text-white capitalize">
          {{ receipt.description || 'Comprobante de Asamblea' }}
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 capitalize">
          {{ formattedDate }} — Asentado en tesorería
        </p>
      </div>

      <!-- Itemized Receipt Details -->
      <div class="p-4 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/80 dark:border-[#17254e] space-y-2.5 font-mono text-xs">
        <div class="text-[11px] uppercase tracking-wider font-sans font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1.5">
          Distribución del efectivo entregado
        </div>

        <template v-if="receipt.entries && receipt.entries.length > 0">
          <div
            v-for="(entry, idx) in receipt.entries"
            :key="entry.id || idx"
            class="flex justify-between items-center text-slate-700 dark:text-slate-300 gap-2"
          >
            <span class="truncate">
              {{ entry.description || entry.account_type || entry.type || 'Abono contable' }}
            </span>
            <AmountDisplay :amount="entry.amount" size="sm" variant="default" />
          </div>
        </template>
        <template v-else>
          <div class="flex justify-between items-center text-slate-700 dark:text-slate-300">
            <span>Abono registrado</span>
            <AmountDisplay :amount="receipt.total_amount" size="sm" variant="default" />
          </div>
        </template>

        <div class="border-t border-dashed border-slate-300 dark:border-slate-700 pt-2 flex justify-between items-center font-bold text-sm text-slate-900 dark:text-white font-sans">
          <span>TOTAL RECIBIDO</span>
          <AmountDisplay :amount="receipt.total_amount" size="md" variant="default" />
        </div>
      </div>

      <!-- Footer Info -->
      <div class="p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/80 dark:border-[#17254e] text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>Registro de Tesorería: <strong class="text-slate-800 dark:text-slate-200">Asentado</strong></span>
        <span class="font-mono text-slate-400 dark:text-slate-500 truncate ml-2">
          ID: {{ receipt.operation_id }}
        </span>
      </div>
    </div>
  </BottomSheet>
</template>
