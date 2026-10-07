<!-- Copyright 2026 Collaborative Saving Project. All rights reserved. -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { RefreshDouble, WarningCircle } from 'iconoir-vue/regular';
import NextMeetingHeroCard from '../components/NextMeetingHeroCard.vue';
import CapitalSummaryCard from '../components/CapitalSummaryCard.vue';
import DebtSummaryCard from '../components/DebtSummaryCard.vue';
import SpecialFundsCard from '../components/SpecialFundsCard.vue';
import RecentHistoryCard from '../components/RecentHistoryCard.vue';
import MeetingBreakdownSheet from '../components/MeetingBreakdownSheet.vue';
import LoanDetailSheet from '../components/LoanDetailSheet.vue';
import DigitalReceiptSheet from '@/features/history/components/DigitalReceiptSheet.vue';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useMemberPortalStore } from '../stores/memberPortalStore';
import type { MemberPayment } from '@/api';

const router = useRouter();
const authStore = useAuthStore();
const portalStore = useMemberPortalStore();

// Sheets state
const isBreakdownOpen = ref(false);
const isLoanSheetOpen = ref(false);
const selectedLoanId = ref<string | null>(null);
const isReceiptOpen = ref(false);
const selectedReceipt = ref<MemberPayment | null>(null);

const selectedLoan = computed(() => {
  if (!selectedLoanId.value) return null;
  return portalStore.loans.find((l) => l.id === selectedLoanId.value) || null;
});

const formattedMeetingDate = computed(() => {
  if (!portalStore.activeMeeting?.date) return null;
  try {
    const d = new Date(portalStore.activeMeeting.date);
    return d.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(portalStore.activeMeeting.date);
  }
});

function handleSelectLoan(loanId: string) {
  selectedLoanId.value = loanId;
  isLoanSheetOpen.value = true;
}

function handleSelectReceipt(receipt: MemberPayment) {
  selectedReceipt.value = receipt;
  isReceiptOpen.value = true;
}

function handleViewAllHistory() {
  router.push('/history');
}

async function loadData(force = false) {
  const memberId = authStore.memberProfile?.id;
  if (!memberId) return;
  try {
    await portalStore.fetchMemberFinancialData(memberId, force);
  } catch {
    // Error is handled in store and displayed in UI
  }
}

onMounted(() => {
  if (authStore.memberProfile?.id) {
    loadData();
  }
});

watch(
  () => authStore.memberProfile?.id,
  (newId) => {
    if (newId) {
      loadData();
    }
  }
);
</script>

<template>
  <div class="space-y-4">
    <!-- Pull to refresh / Quick refresh toolbar -->
    <div class="flex items-center justify-between px-1">
      <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">
        Resumen Financiero del Socio
      </span>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        :disabled="portalStore.loading"
        @click="loadData(true)"
      >
        <RefreshDouble
          class="w-3.5 h-3.5"
          :class="{ 'animate-spin': portalStore.loading }"
        />
        <span>Actualizar</span>
      </button>
    </div>

    <!-- Error Banner with Retry -->
    <div
      v-if="portalStore.error && !portalStore.lastFetchedMemberId"
      class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3"
    >
      <WarningCircle class="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
      <div class="min-w-0 flex-1">
        <h4 class="text-xs font-bold text-rose-800 dark:text-rose-200">
          No pudimos cargar tu información financiera
        </h4>
        <p class="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
          {{ portalStore.error }}
        </p>
        <button
          type="button"
          class="mt-2 text-xs font-bold text-rose-700 dark:text-rose-300 underline cursor-pointer"
          @click="loadData(true)"
        >
          Reintentar ahora
        </button>
      </div>
    </div>

    <!-- Skeletons Loading State -->
    <template v-if="portalStore.loading && !portalStore.lastFetchedMemberId">
      <div class="space-y-4 animate-pulse">
        <!-- Hero Card Skeleton -->
        <div class="p-6 rounded-3xl bg-slate-200/80 dark:bg-slate-800/80 h-44 flex flex-col justify-between" />
        <!-- Mi Capital Skeleton -->
        <div class="p-5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60 h-36" />
        <!-- Mi Deuda Skeleton -->
        <div class="p-5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60 h-40" />
        <!-- Fondos Skeleton -->
        <div class="p-5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60 h-28" />
        <!-- Recibos Skeleton -->
        <div class="p-5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60 h-48" />
      </div>
    </template>

    <!-- Real Connected Cards -->
    <template v-else>
      <!-- Hero Card: Próxima Reunión y Monto en Efectivo -->
      <NextMeetingHeroCard
        :meeting-date="formattedMeetingDate"
        :total-due="portalStore.totalDue"
        :has-active-meeting="portalStore.hasActiveMeeting"
        @open-breakdown="isBreakdownOpen = true"
        @view-history="handleViewAllHistory"
      />

      <!-- Mi Capital (Acciones) -->
      <CapitalSummaryCard
        :total-capital="portalStore.totalCapital"
        :total-shares-count="portalStore.totalSharesCount"
        :grouped-stocks="portalStore.groupedStockSubscriptions"
      />

      <!-- Mi Deuda (Préstamos) -->
      <DebtSummaryCard
        :total-debt="portalStore.totalDebt"
        :loans="portalStore.activeLoans"
        @select-loan="handleSelectLoan"
      />

      <!-- Fondos & Actividades (Aportes especiales) -->
      <SpecialFundsCard
        :total-funds="portalStore.totalSpecialFunds"
        :funds="portalStore.mandatoryFunds"
      />

      <!-- Recibos de Pago y Comprobantes -->
      <RecentHistoryCard
        :payments="portalStore.payments"
        @select-receipt="handleSelectReceipt"
        @view-all="handleViewAllHistory"
      />
    </template>

    <!-- Modals & BottomSheets -->
    <MeetingBreakdownSheet
      v-model="isBreakdownOpen"
      :dues="portalStore.dues"
      :meeting-date="formattedMeetingDate"
      :current-debt="portalStore.totalDebt"
    />
    <LoanDetailSheet
      v-model="isLoanSheetOpen"
      :loan="selectedLoan"
    />
    <DigitalReceiptSheet
      v-model="isReceiptOpen"
      :receipt="selectedReceipt"
    />
  </div>
</template>
