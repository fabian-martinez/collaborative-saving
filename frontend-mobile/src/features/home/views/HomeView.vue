<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import NextMeetingHeroCard from '../components/NextMeetingHeroCard.vue';
import CapitalSummaryCard from '../components/CapitalSummaryCard.vue';
import DebtSummaryCard from '../components/DebtSummaryCard.vue';
import SpecialFundsCard from '../components/SpecialFundsCard.vue';
import RecentHistoryCard, { type HistoryItem } from '../components/RecentHistoryCard.vue';
import MeetingBreakdownSheet from '../components/MeetingBreakdownSheet.vue';
import LoanDetailSheet from '../components/LoanDetailSheet.vue';
import DigitalReceiptSheet from '@/features/history/components/DigitalReceiptSheet.vue';

const router = useRouter();

// Sheets state
const isBreakdownOpen = ref(false);
const isLoanSheetOpen = ref(false);
const selectedLoanId = ref<string | null>(null);
const isReceiptOpen = ref(false);
const selectedReceipt = ref<HistoryItem | null>(null);

function handleSelectLoan(loanId: string) {
  selectedLoanId.value = loanId;
  isLoanSheetOpen.value = true;
}

function handleSelectReceipt(receipt: HistoryItem) {
  selectedReceipt.value = receipt;
  isReceiptOpen.value = true;
}

function handleViewAllHistory() {
  router.push('/history');
}
</script>

<template>
  <div class="space-y-4">
    <!-- Hero Card: Próxima Reunión y Monto en Efectivo -->
    <NextMeetingHeroCard
      meeting-date="Sábado 15 de Octubre, 2026"
      :total-due="185000"
      @open-breakdown="isBreakdownOpen = true"
      @view-history="handleViewAllHistory"
    />

    <!-- Mi Capital (Acciones) -->
    <CapitalSummaryCard :total-capital="2450000" />

    <!-- Mi Deuda (Préstamos) -->
    <DebtSummaryCard :total-debt="800000" @select-loan="handleSelectLoan" />

    <!-- Fondos & Actividades (Antes "Otros") -->
    <SpecialFundsCard />

    <!-- Recibos de Pago y Comprobantes -->
    <RecentHistoryCard
      @select-receipt="handleSelectReceipt"
      @view-all="handleViewAllHistory"
    />

    <!-- Modals & BottomSheets -->
    <MeetingBreakdownSheet v-model="isBreakdownOpen" />
    <LoanDetailSheet v-model="isLoanSheetOpen" :loan-id="selectedLoanId" />
    <DigitalReceiptSheet v-model="isReceiptOpen" :receipt="selectedReceipt" />
  </div>
</template>
