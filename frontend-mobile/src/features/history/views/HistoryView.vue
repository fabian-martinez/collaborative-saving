<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Card from '@/shared/components/ui/Card.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import Badge from '@/shared/components/ui/Badge.vue';
import DigitalReceiptSheet from '../components/DigitalReceiptSheet.vue';
import type { HistoryItem } from '@/features/home/components/RecentHistoryCard.vue';

const router = useRouter();

const receipts = ref<HistoryItem[]>([
  { id: 'rec-1', meetingNumber: 8, date: '15 Sep 2026', amount: 185000, status: 'confirmed' },
  { id: 'rec-2', meetingNumber: 7, date: '15 Ago 2026', amount: 185000, status: 'confirmed' },
  { id: 'rec-3', meetingNumber: 6, date: '15 Jul 2026', amount: 170000, status: 'confirmed' },
  { id: 'rec-4', meetingNumber: 5, date: '15 Jun 2026', amount: 170000, status: 'confirmed' },
  { id: 'rec-5', meetingNumber: 4, date: '15 May 2026', amount: 165000, status: 'confirmed' },
  { id: 'rec-6', meetingNumber: 3, date: '15 Abr 2026', amount: 165000, status: 'confirmed' },
  { id: 'rec-7', meetingNumber: 2, date: '15 Mar 2026', amount: 150000, status: 'confirmed' },
  { id: 'rec-8', meetingNumber: 1, date: '15 Feb 2026', amount: 150000, status: 'confirmed' }
]);

const isReceiptOpen = ref(false);
const selectedReceipt = ref<HistoryItem | null>(null);

function openReceipt(receipt: HistoryItem) {
  selectedReceipt.value = receipt;
  isReceiptOpen.value = true;
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header with Back Button -->
    <div class="flex items-center gap-3 pt-1">
      <button
        type="button"
        class="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 active:scale-95 transition-all"
        @click="router.back()"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <h2 class="text-base font-bold text-white tracking-tight">Historial de Transacciones</h2>
        <span class="text-xs text-slate-400">Recibos de pagos entregados en efectivo</span>
      </div>
    </div>

    <!-- Summary Box -->
    <div class="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
      <div>
        <span class="text-xs text-slate-400 block font-medium">Total aportado este ciclo</span>
        <span class="text-xs text-emerald-400 font-bold">8 reuniones cumplidas</span>
      </div>
      <AmountDisplay :amount="1340000" size="xl" variant="success" />
    </div>

    <!-- Receipts List -->
    <Card class="space-y-2 !p-3">
      <div
        v-for="receipt in receipts"
        :key="receipt.id"
        class="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700 active:scale-[0.99] transition-all cursor-pointer"
        @click="openReceipt(receipt)"
      >
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center font-mono font-bold text-xs text-slate-200">
            #{{ receipt.meetingNumber }}
          </div>
          <div>
            <span class="text-xs font-semibold text-white block">Reunión #{{ receipt.meetingNumber }}</span>
            <span class="text-[11px] text-slate-400">{{ receipt.date }}</span>
          </div>
        </div>

        <div class="text-right">
          <AmountDisplay :amount="receipt.amount" size="sm" />
          <Badge variant="success" class="mt-0.5 !text-[10px] !py-0">Pagado ✅</Badge>
        </div>
      </div>
    </Card>

    <DigitalReceiptSheet v-model="isReceiptOpen" :receipt="selectedReceipt" />
  </div>
</template>
