<!-- Copyright 2026 Collaborative Saving Project. All rights reserved. -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NavArrowLeft } from 'iconoir-vue/regular';
import Card from '@/shared/components/ui/Card.vue';
import AmountDisplay from '@/shared/components/ui/AmountDisplay.vue';
import Badge from '@/shared/components/ui/Badge.vue';
import DigitalReceiptSheet from '../components/DigitalReceiptSheet.vue';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useMemberPortalStore } from '@/features/home/stores/memberPortalStore';
import type { MemberPayment } from '@/api';

const router = useRouter();
const authStore = useAuthStore();
const portalStore = useMemberPortalStore();

const isReceiptOpen = ref(false);
const selectedReceipt = ref<MemberPayment | null>(null);

function openReceipt(receipt: MemberPayment) {
  selectedReceipt.value = receipt;
  isReceiptOpen.value = true;
}

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

const badgeSummaryText = computed(() => {
  const count = portalStore.payments.length;
  return `${count} ${count === 1 ? 'recibo registrado' : 'recibos registrados'}`;
});

onMounted(() => {
  const memberId = authStore.memberProfile?.id;
  if (memberId && portalStore.payments.length === 0) {
    portalStore.fetchMemberFinancialData(memberId);
  }
});
</script>

<template>
  <div class="space-y-4">
    <!-- Header with Back Button using NavArrowLeft from Iconoir -->
    <div class="flex items-center gap-3 pt-1">
      <button
        type="button"
        class="p-2 rounded-xl bg-white dark:bg-[#0e1838] border border-slate-200 dark:border-[#1a2750] text-slate-700 dark:text-slate-300 active:scale-95 transition-all cursor-pointer"
        aria-label="Volver"
        @click="router.back()"
      >
        <NavArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h2 class="text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Historial de Transacciones
        </h2>
        <span class="text-xs text-slate-500 dark:text-slate-400">
          Recibos de pagos entregados en efectivo
        </span>
      </div>
    </div>

    <!-- Summary Box -->
    <div class="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-100 to-white dark:from-[#0e1838] dark:to-[#080e22] border border-slate-200 dark:border-[#1a2750] shadow-sm dark:shadow-md dark:shadow-[#05091a]/60 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
          Total aportado este ciclo
        </span>
        <Badge variant="success">{{ badgeSummaryText }}</Badge>
      </div>
      <div>
        <AmountDisplay :amount="portalStore.totalHistoricalPaid" size="hero" variant="default" />
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="portalStore.loading && portalStore.payments.length === 0" class="space-y-3 animate-pulse">
      <div class="p-4 rounded-xl bg-slate-200 dark:bg-slate-800 h-20" />
      <div class="p-4 rounded-xl bg-slate-200 dark:bg-slate-800 h-20" />
      <div class="p-4 rounded-xl bg-slate-200 dark:bg-slate-800 h-20" />
    </div>

    <!-- Empty State -->
    <Card
      v-else-if="portalStore.payments.length === 0"
      class="p-8 text-center text-xs text-slate-500 dark:text-slate-400"
    >
      No tienes recibos de pago registrados en tesorería todavía.
    </Card>

    <!-- Receipts List -->
    <Card v-else class="space-y-2.5">
      <div
        v-for="(receipt, index) in portalStore.payments"
        :key="receipt.operation_id || index"
        class="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#091129] border border-slate-200/70 dark:border-[#17254e] hover:border-slate-300 dark:hover:border-[#22356a] active:scale-[0.99] transition-all cursor-pointer gap-3"
        @click="openReceipt(receipt)"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl bg-slate-200 dark:bg-[#15234c] border border-slate-300 dark:border-[#22356a] flex items-center justify-center font-mono font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0">
            #{{ index + 1 }}
          </div>
          <div class="min-w-0">
            <span class="text-xs font-semibold text-slate-900 dark:text-white block truncate">
              {{ receipt.description || 'Abono Asamblea' }}
            </span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">
              {{ formatPaymentDate(receipt.date) }}
            </span>
          </div>
        </div>

        <div class="flex flex-col items-end shrink-0 gap-1">
          <AmountDisplay :amount="receipt.total_amount" size="sm" variant="default" />
          <Badge variant="success" class="!text-[10px] !py-0.5 !px-2">Pagado ✅</Badge>
        </div>
      </div>
    </Card>

    <DigitalReceiptSheet v-model="isReceiptOpen" :receipt="selectedReceipt" />
  </div>
</template>
