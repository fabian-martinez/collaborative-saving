/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  meetingsApi,
  membersApi,
  stocksApi,
  type Meeting,
  type MemberDue,
  type StockSubscription,
  type Stock,
  type Loan,
  type MemberPayment,
} from '@/api';

export interface GroupedStockHolding {
  stock_id: string;
  name: string;
  type: string;
  quantity: number;
  unit_value: number;
  total_value: number;
}

export const useMemberPortalStore = defineStore('memberPortal', () => {
  // State
  const activeMeeting = ref<Meeting | null>(null);
  const dues = ref<MemberDue[]>([]);
  const stockSubscriptions = ref<StockSubscription[]>([]);
  const stocks = ref<Stock[]>([]);
  const loans = ref<Loan[]>([]);
  const payments = ref<MemberPayment[]>([]);

  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetchedMemberId = ref<string | null>(null);

  // Computed
  const hasActiveMeeting = computed(() => !!activeMeeting.value);

  const totalDue = computed(() => {
    return dues.value.reduce((sum, due) => sum + (Number(due.amount) || 0), 0);
  });

  const stockDues = computed(() => {
    return dues.value.filter((due) => due.type === 'stock_fee');
  });

  const loanDues = computed(() => {
    return dues.value.filter((due) => due.type === 'loan_payment');
  });

  const mandatoryFunds = computed(() => {
    return dues.value.filter((due) => due.type === 'mandatory_contribution');
  });

  const totalSpecialFunds = computed(() => {
    return mandatoryFunds.value.reduce(
      (sum, fund) => sum + (Number(fund.amount) || 0),
      0
    );
  });

  const stocksMap = computed(() => {
    return new Map<string, Stock>(stocks.value.map((s) => [s.id, s]));
  });

  const groupedStockSubscriptions = computed<GroupedStockHolding[]>(() => {
    const map = new Map<string, { quantity: number; stockType: string }>();

    for (const sub of stockSubscriptions.value) {
      if (sub.status && sub.status !== 'active') continue;
      const key = sub.stock_id;
      const existing = map.get(key) || { quantity: 0, stockType: sub.stock_type };
      existing.quantity += Number(sub.quantity) || 0;
      map.set(key, existing);
    }

    const result: GroupedStockHolding[] = [];
    for (const [stockId, data] of map.entries()) {
      const stock = stocksMap.value.get(stockId);
      const name = stock?.name || data.stockType || 'Acción';
      const type = stock?.type || data.stockType || 'Acción';
      const unitValue = stock ? Number(stock.value) || 0 : 0;
      const totalValue = data.quantity * unitValue;

      result.push({
        stock_id: stockId,
        name,
        type,
        quantity: data.quantity,
        unit_value: unitValue,
        total_value: totalValue,
      });
    }

    // Sort by name for deterministic ordering
    return result.sort((a, b) => a.name.localeCompare(b.name));
  });

  const totalCapital = computed(() => {
    return groupedStockSubscriptions.value.reduce(
      (sum, item) => sum + item.total_value,
      0
    );
  });

  const totalSharesCount = computed(() => {
    return groupedStockSubscriptions.value.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  });

  const activeLoans = computed(() => {
    return loans.value.filter(
      (loan) =>
        loan.status === 'active' ||
        (loan.outstanding_balance && Number(loan.outstanding_balance) > 0)
    );
  });

  const totalDebt = computed(() => {
    return activeLoans.value.reduce(
      (sum, loan) => sum + (Number(loan.outstanding_balance) || 0),
      0
    );
  });

  const recentPayments = computed(() => {
    return payments.value.slice(0, 3);
  });

  const totalHistoricalPaid = computed(() => {
    return payments.value.reduce(
      (sum, payment) => sum + (Number(payment.total_amount) || 0),
      0
    );
  });

  // Actions
  async function fetchMemberFinancialData(
    memberId: string,
    force = false
  ): Promise<void> {
    if (!memberId) return;

    if (!force && lastFetchedMemberId.value === memberId && !error.value && !loading.value && (dues.value.length > 0 || payments.value.length > 0 || stockSubscriptions.value.length > 0)) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const [
        meetingRes,
        duesRes,
        subsRes,
        loansRes,
        paymentsRes,
        stocksRes,
      ] = await Promise.all([
        meetingsApi.getActiveMeeting().catch(() => null),
        membersApi.getMemberDues(memberId),
        membersApi.getMemberStockSubscriptions(memberId),
        membersApi.getMemberLoans(memberId),
        membersApi.getMemberPayments(memberId),
        stocksApi.getStocks().catch(() => []),
      ]);

      activeMeeting.value = meetingRes;
      dues.value = duesRes || [];
      stockSubscriptions.value = subsRes || [];
      loans.value = loansRes || [];
      payments.value = paymentsRes || [];
      stocks.value = stocksRes || [];

      lastFetchedMemberId.value = memberId;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al cargar datos financieros';
      console.error('[memberPortalStore] Error al cargar finanzas:', err);
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function refresh(memberId: string): Promise<void> {
    await fetchMemberFinancialData(memberId, true);
  }

  function reset(): void {
    activeMeeting.value = null;
    dues.value = [];
    stockSubscriptions.value = [];
    stocks.value = [];
    loans.value = [];
    payments.value = [];
    loading.value = false;
    error.value = null;
    lastFetchedMemberId.value = null;
  }

  return {
    // State
    activeMeeting,
    dues,
    stockSubscriptions,
    stocks,
    loans,
    payments,
    loading,
    error,
    lastFetchedMemberId,

    // Computed
    hasActiveMeeting,
    totalDue,
    stockDues,
    loanDues,
    mandatoryFunds,
    totalSpecialFunds,
    stocksMap,
    groupedStockSubscriptions,
    totalCapital,
    totalSharesCount,
    activeLoans,
    totalDebt,
    recentPayments,
    totalHistoricalPaid,

    // Actions
    fetchMemberFinancialData,
    refresh,
    reset,
  };
});
