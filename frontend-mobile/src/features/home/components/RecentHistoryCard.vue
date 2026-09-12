<script setup lang="ts">
import { Page } from 'iconoir-vue/regular';
import Card from '@/shared/components/ui/Card.vue';
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
  <Card class="space-y-3.5">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
          <Page class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <h3 class="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider truncate">Recibos de Pago</h3>
          <span class="text-xs text-slate-500 dark:text-slate-400 truncate block">Comprobantes de asambleas</span>
        </div>
      </div>
      <button
        type="button"
        class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline active:scale-95 transition-all shrink-0"
        @click="emit('view-all')"
      >
        Ver todos →
      </button>
    </div>

    <!-- Recent receipts list -->
    <div class="space-y-2 pt-1 border-t border-slate-200/80 dark:border-[#17254e]">
      <div
        v-for="item in mockRecentHistory"
        :key="item.id"
        class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] hover:border-slate-300 dark:hover:border-[#22356a] active:scale-[0.99] transition-all cursor-pointer gap-3"
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

        <div class="text-right shrink-0">
          <AmountDisplay :amount="item.amount" size="sm" variant="default" />
          <Badge variant="success" class="mt-0.5 !text-[10px] !py-0 block">Registrado ✅</Badge>
        </div>
      </div>
    </div>
  </Card>
</template>
