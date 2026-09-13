<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { NavArrowLeft } from 'iconoir-vue/regular';
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
    <!-- Header with Back Button using NavArrowLeft from Iconoir -->
    <div class="flex items-center gap-3 pt-1">
      <button
        type="button"
        class="p-2 rounded-xl bg-white dark:bg-[#0e1838] border border-slate-200 dark:border-[#1a2750] text-slate-700 dark:text-slate-300 active:scale-95 transition-all"
        @click="router.back()"
      >
        <NavArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h2 class="text-base font-bold text-slate-900 dark:text-white tracking-tight">Historial de Transacciones</h2>
        <span class="text-xs text-slate-500 dark:text-slate-400">Recibos de pagos entregados en efectivo</span>
      </div>
    </div>

    <!-- Summary Box -->
    <div class="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-100 to-white dark:from-[#0e1838] dark:to-[#080e22] border border-slate-200 dark:border-[#1a2750] shadow-sm dark:shadow-md dark:shadow-[#05091a]/60 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Total aportado este ciclo</span>
        <Badge variant="success">8 reuniones cumplidas</Badge>
      </div>
      <div>
        <AmountDisplay :amount="1340000" size="hero" variant="default" />
      </div>
    </div>

    <!-- Receipts List -->
    <Card class="space-y-2.5">
      <div
        v-for="receipt in receipts"
        :key="receipt.id"
        class="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] hover:border-slate-300 dark:hover:border-[#22356a] active:scale-[0.99] transition-all cursor-pointer gap-3"
        @click="openReceipt(receipt)"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl bg-slate-200 dark:bg-[#15234c] border border-slate-300 dark:border-[#22356a] flex items-center justify-center font-mono font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0">
            #{{ receipt.meetingNumber }}
          </div>
          <div class="min-w-0">
            <span class="text-xs font-semibold text-slate-900 dark:text-white block truncate">Reunión #{{ receipt.meetingNumber }}</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">{{ receipt.date }}</span>
          </div>
        </div>

        <div class="flex flex-col items-end shrink-0 gap-1">
          <AmountDisplay :amount="receipt.amount" size="sm" variant="default" />
          <Badge variant="success" class="!text-[10px] !py-0.5 !px-2">Pagado ✅</Badge>
        </div>
      </div>
    </Card>

    <DigitalReceiptSheet v-model="isReceiptOpen" :receipt="selectedReceipt" />
  </div>
</template>
