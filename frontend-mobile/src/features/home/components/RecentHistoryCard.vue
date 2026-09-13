<script setup lang="ts">
import { Page } from 'iconoir-vue/regular';
import SummaryCard from '@/shared/components/ui/SummaryCard.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import Badge from '@/shared/components/ui/Badge.vue';

export interface HistoryItem {
  id: string;
  meetingNumber: number;
  date: string;
  amount: number;
  status: 'confirmed' | 'pending';
}

const mockRecentHistory: HistoryItem[] = [
  { id: 'rec-1', meetingNumber: 8, date: '15 Sep 2026', amount: 185000, status: 'confirmed' },
  { id: 'rec-2', meetingNumber: 7, date: '15 Ago 2026', amount: 185000, status: 'confirmed' },
  { id: 'rec-3', meetingNumber: 6, date: '15 Jul 2026', amount: 170000, status: 'confirmed' }
];

const emit = defineEmits<{
  (e: 'select-receipt', receipt: HistoryItem): void;
  (e: 'view-all'): void;
}>();
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
        class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline active:scale-95 transition-all shrink-0"
        @click="emit('view-all')"
      >
        Ver todos →
      </button>
    </template>

    <div
      v-for="item in mockRecentHistory"
      :key="item.id"
      class="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] hover:border-slate-300 dark:hover:border-[#22356a] active:scale-[0.99] transition-all cursor-pointer gap-3"
      @click="emit('select-receipt', item)"
    >
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-8 h-8 rounded-lg bg-slate-200 dark:bg-[#15234c] flex items-center justify-center font-mono font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0">
          #{{ item.meetingNumber }}
        </div>
        <div class="min-w-0">
          <span class="text-xs font-semibold text-slate-900 dark:text-white block truncate">Reunión #{{ item.meetingNumber }}</span>
          <span class="text-[11px] text-slate-500 dark:text-slate-400">{{ item.date }}</span>
        </div>
      </div>

      <div class="flex flex-col items-end shrink-0 gap-1">
        <AmountDisplay :amount="item.amount" size="sm" variant="default" />
        <Badge variant="success" class="!text-[10px] !py-0.5 !px-2">Registrado ✅</Badge>
      </div>
    </div>
  </SummaryCard>
</template>
