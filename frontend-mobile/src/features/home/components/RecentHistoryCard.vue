<!-- Copyright 2026 Collaborative Saving Project. All rights reserved. -->
<script setup lang="ts">
import { Page } from 'iconoir-vue/regular';
import SummaryCard from '@/shared/components/ui/SummaryCard.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import Badge from '@/shared/components/ui/Badge.vue';
import type { MemberPayment } from '@/api';

withDefaults(
  defineProps<{
    payments?: MemberPayment[];
  }>(),
  {
    payments: () => [],
  }
);

const emit = defineEmits<{
  (e: 'select-receipt', receipt: MemberPayment): void;
  (e: 'view-all'): void;
}>();

function formatPaymentDate(dateStr: string | Date): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}
</script>

<template>
  <SummaryCard
    :icon="Page"
    icon-color="purple"
    title="Recibos de Pago"
    subtitle="Comprobantes de asambleas"
  >
    <template #header-action>
      <button
        type="button"
        class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline active:scale-95 transition-all shrink-0 cursor-pointer"
        @click="emit('view-all')"
      >
        Ver todos →
      </button>
    </template>

    <!-- Empty State -->
    <div
      v-if="payments.length === 0"
      class="p-4 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] text-center text-xs text-slate-500 dark:text-slate-400"
    >
      No tienes comprobantes de pago registrados en tesorería.
    </div>

    <!-- Payments List -->
    <div
      v-for="(item, index) in payments.slice(0, 3)"
      :key="item.operation_id || index"
      class="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] hover:border-slate-300 dark:hover:border-[#22356a] active:scale-[0.99] transition-all cursor-pointer gap-3"
      @click="emit('select-receipt', item)"
    >
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-8 h-8 rounded-lg bg-slate-200 dark:bg-[#15234c] flex items-center justify-center font-mono font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0">
          #{{ index + 1 }}
        </div>
        <div class="min-w-0">
          <span class="text-xs font-semibold text-slate-900 dark:text-white block truncate">
            {{ item.description || 'Abono Asamblea' }}
          </span>
          <span class="text-[11px] text-slate-500 dark:text-slate-400">
            {{ formatPaymentDate(item.date) }}
          </span>
        </div>
      </div>

      <div class="flex flex-col items-end shrink-0 gap-1">
        <AmountDisplay :amount="item.total_amount" size="sm" variant="default" />
        <Badge variant="success" class="!text-[10px] !py-0.5 !px-2">Registrado ✅</Badge>
      </div>
    </div>
  </SummaryCard>
</template>
