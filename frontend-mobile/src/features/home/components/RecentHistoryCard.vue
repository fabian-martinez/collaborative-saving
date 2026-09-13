<script setup lang="ts">
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
  <Card class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="p-2 rounded-xl bg-purple-500/10 text-purple-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h3 class="text-xs uppercase font-bold text-slate-400 tracking-wider">Recibos de Pago</h3>
          <span class="text-xs text-slate-400">Comprobantes de asambleas</span>
        </div>
      </div>
      <button
        type="button"
        class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 active:scale-95 transition-all"
        @click="emit('view-all')"
      >
        Ver todos →
      </button>
    </div>

    <!-- Recent receipts list -->
    <div class="space-y-2 pt-1">
      <div
        v-for="item in mockRecentHistory"
        :key="item.id"
        class="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700 active:scale-[0.99] transition-all cursor-pointer"
        @click="emit('select-receipt', item)"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-slate-300">
            #{{ item.meetingNumber }}
          </div>
          <div>
            <span class="text-xs font-semibold text-white block">Reunión #{{ item.meetingNumber }}</span>
            <span class="text-[11px] text-slate-400">{{ item.date }}</span>
          </div>
        </div>

        <div class="text-right">
          <AmountDisplay :amount="item.amount" size="sm" />
          <Badge variant="success" class="mt-0.5 !text-[10px] !py-0">Registrado en reunión</Badge>
        </div>
      </div>
    </div>
  </Card>
</template>
