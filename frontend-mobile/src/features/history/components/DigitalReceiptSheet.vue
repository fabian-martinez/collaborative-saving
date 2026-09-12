<script setup lang="ts">
import { Check } from 'iconoir-vue/regular';
import BottomSheet from '@/shared/components/overlays/BottomSheet.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import Badge from '@/shared/components/ui/Badge.vue';
import type { HistoryItem } from '@/features/home/components/RecentHistoryCard.vue';

defineProps<{
  modelValue: boolean;
  receipt: HistoryItem | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();
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
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">Reunión Ordinaria #{{ receipt.meetingNumber }}</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">{{ receipt.date }} — Acta aprobada</p>
      </div>

      <!-- Itemized Receipt Details -->
      <div class="p-4 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/80 dark:border-[#17254e] space-y-2.5 font-mono text-xs">
        <div class="text-[11px] uppercase tracking-wider font-sans font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1.5">
          Distribución del efectivo entregado
        </div>

        <div class="flex justify-between text-slate-700 dark:text-slate-300">
          <span>Aporte Acciones (3G + 5P)</span>
          <AmountDisplay :amount="50000" size="sm" variant="default" />
        </div>

        <div class="flex justify-between text-slate-700 dark:text-slate-300">
          <span>Abono Capital Crédito #1</span>
          <AmountDisplay :amount="60000" size="sm" variant="default" />
        </div>

        <div class="flex justify-between text-slate-700 dark:text-slate-300">
          <span>Intereses Crédito #1 (1.5%)</span>
          <AmountDisplay :amount="15000" size="sm" variant="default" />
        </div>

        <div class="flex justify-between text-slate-700 dark:text-slate-300">
          <span>Abono Capital Crédito Ágil</span>
          <AmountDisplay :amount="30000" size="sm" variant="default" />
        </div>

        <div class="flex justify-between text-slate-700 dark:text-slate-300">
          <span>Intereses Crédito Ágil (2.0%)</span>
          <AmountDisplay :amount="5000" size="sm" variant="default" />
        </div>

        <div class="flex justify-between text-slate-700 dark:text-slate-300">
          <span>Seguro Solidario / Eventos</span>
          <AmountDisplay :amount="25000" size="sm" variant="default" />
        </div>

        <div class="border-t border-dashed border-slate-300 dark:border-slate-700 pt-2 flex justify-between font-bold text-sm text-slate-900 dark:text-white font-sans">
          <span>TOTAL RECIBIDO</span>
          <AmountDisplay :amount="receipt.amount" size="md" variant="default" />
        </div>
      </div>

      <!-- Footer Info -->
      <div class="p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/80 dark:border-[#17254e] text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>Registro de Tesorería: <strong class="text-slate-800 dark:text-slate-200">Aprobado</strong></span>
        <span class="font-mono text-slate-400 dark:text-slate-500">ID: {{ receipt.id }}-CONF</span>
      </div>
    </div>
  </BottomSheet>
</template>
