/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMemberPortalStore } from './memberPortalStore';
import { meetingsApi, membersApi, stocksApi } from '@/api';

vi.mock('@/api', () => ({
  meetingsApi: {
    getActiveMeeting: vi.fn(),
  },
  membersApi: {
    getMemberDues: vi.fn(),
    getMemberStockSubscriptions: vi.fn(),
    getMemberLoans: vi.fn(),
    getMemberPayments: vi.fn(),
  },
  stocksApi: {
    getStocks: vi.fn(),
  },
}));

describe('useMemberPortalStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should initialize with default empty state', () => {
    const store = useMemberPortalStore();

    expect(store.activeMeeting).toBeNull();
    expect(store.dues).toEqual([]);
    expect(store.stockSubscriptions).toEqual([]);
    expect(store.stocks).toEqual([]);
    expect(store.loans).toEqual([]);
    expect(store.payments).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(store.hasActiveMeeting).toBe(false);
    expect(store.totalDue).toBe(0);
    expect(store.totalCapital).toBe(0);
    expect(store.totalDebt).toBe(0);
    expect(store.totalSpecialFunds).toBe(0);
    expect(store.recentPayments).toEqual([]);
    expect(store.totalHistoricalPaid).toBe(0);
  });

  it('should fetch financial data concurrently and compute financial metrics correctly', async () => {
    const store = useMemberPortalStore();

    const mockMeeting = {
      id: 'm-1',
      date: '2026-10-15T18:00:00Z',
      status: 'active' as const,
      notes: null,
      created_at: '2026-10-01',
    };

    const mockDues = [
      {
        type: 'stock_fee',
        description: 'Cuota de acción: Acción Ordinaria',
        amount: 50000,
        stock_quantity: 2,
        monthly_contribution: 25000,
      },
      {
        type: 'loan_payment',
        description: 'Cuota préstamo: Corriente',
        amount: 75000,
        details: {
          interest: 15000,
          principal: 60000,
          outstanding_balance: 500000,
        },
      },
      {
        type: 'mandatory_contribution',
        description: 'Seguro de Cartera',
        amount: 15000,
      },
      {
        type: 'mandatory_contribution',
        description: 'Aporte Solidario',
        amount: 10000,
      },
    ];

    const mockSubscriptions = [
      {
        id: 'sub-1',
        stock_id: 'stock-1',
        stock_type: 'Acción Ordinaria',
        quantity: 3,
        purchase_date: '2026-01-10',
        status: 'active',
      },
      {
        id: 'sub-2',
        stock_id: 'stock-2',
        stock_type: 'Acción Preferencial',
        quantity: 5,
        purchase_date: '2026-02-15',
        status: 'active',
      },
      {
        id: 'sub-3',
        stock_id: 'stock-1',
        stock_type: 'Acción Ordinaria',
        quantity: 1,
        purchase_date: '2026-03-20',
        status: 'inactive', // should be excluded
      },
    ];

    const mockStocks = [
      {
        id: 'stock-1',
        name: 'Acción Ordinaria',
        type: 'Acción Ordinaria',
        value: 500000,
        monthly_contribution: 25000,
      },
      {
        id: 'stock-2',
        name: 'Acción Preferencial',
        type: 'Acción Preferencial',
        value: 190000,
        monthly_contribution: 10000,
      },
    ];

    const mockLoans = [
      {
        id: 'loan-1',
        member_id: 'mem-1',
        loan_type: 'Préstamo Corriente',
        approved_amount: 1000000,
        disbursed_amount: 1000000,
        outstanding_balance: 500000,
        monthly_payment_amount: 60000,
        interest_rate: 0.015,
        term: 12,
        status: 'active',
        creation_date: '2026-01-15',
      },
      {
        id: 'loan-2',
        member_id: 'mem-1',
        loan_type: 'Préstamo Ágil',
        approved_amount: 500000,
        disbursed_amount: 500000,
        outstanding_balance: 300000,
        monthly_payment_amount: 30000,
        interest_rate: 0.02,
        term: 6,
        status: 'active',
        creation_date: '2026-03-01',
      },
    ];

    const mockPayments = [
      {
        operation_id: 'op-1',
        type: 'meeting_payment',
        total_amount: 185000,
        date: '2026-09-15',
        meeting_id: 'meet-1',
        entries: [{ type: 'stock_fee', amount: 50000, description: 'Cuota' }],
      },
      {
        operation_id: 'op-2',
        type: 'meeting_payment',
        total_amount: 185000,
        date: '2026-08-15',
        meeting_id: 'meet-2',
        entries: [{ type: 'stock_fee', amount: 50000, description: 'Cuota' }],
      },
      {
        operation_id: 'op-3',
        type: 'meeting_payment',
        total_amount: 170000,
        date: '2026-07-15',
        meeting_id: 'meet-3',
        entries: [{ type: 'stock_fee', amount: 50000, description: 'Cuota' }],
      },
      {
        operation_id: 'op-4',
        type: 'meeting_payment',
        total_amount: 170000,
        date: '2026-06-15',
        meeting_id: 'meet-4',
        entries: [{ type: 'stock_fee', amount: 50000, description: 'Cuota' }],
      },
    ];

    vi.mocked(meetingsApi.getActiveMeeting).mockResolvedValue(mockMeeting);
    vi.mocked(membersApi.getMemberDues).mockResolvedValue(mockDues);
    vi.mocked(membersApi.getMemberStockSubscriptions).mockResolvedValue(mockSubscriptions);
    vi.mocked(membersApi.getMemberLoans).mockResolvedValue(mockLoans);
    vi.mocked(membersApi.getMemberPayments).mockResolvedValue(mockPayments);
    vi.mocked(stocksApi.getStocks).mockResolvedValue(mockStocks);

    await store.fetchMemberFinancialData('mem-1');

    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(store.hasActiveMeeting).toBe(true);
    expect(store.activeMeeting).toEqual(mockMeeting);

    // Total dues: 50000 + 75000 + 15000 + 10000 = 150000
    expect(store.totalDue).toBe(150000);
    expect(store.stockDues.length).toBe(1);
    expect(store.loanDues.length).toBe(1);
    expect(store.mandatoryFunds.length).toBe(2);
    expect(store.totalSpecialFunds).toBe(25000);

    // Grouped stock subscriptions:
    // stock-1: 3 active * 500000 = 1500000
    // stock-2: 5 active * 190000 = 950000
    expect(store.groupedStockSubscriptions).toHaveLength(2);
    expect(store.totalSharesCount).toBe(8);
    expect(store.totalCapital).toBe(2450000);

    // Total debt: 500000 + 300000 = 800000
    expect(store.totalDebt).toBe(800000);
    expect(store.activeLoans).toHaveLength(2);

    // Recent payments: top 3
    expect(store.recentPayments).toHaveLength(3);
    expect(store.recentPayments[0].operation_id).toBe('op-1');

    // Total historical paid: 185000 + 185000 + 170000 + 170000 = 710000
    expect(store.totalHistoricalPaid).toBe(710000);
  });

  it('should handle missing active meeting gracefully without throwing', async () => {
    const store = useMemberPortalStore();

    vi.mocked(meetingsApi.getActiveMeeting).mockRejectedValue(new Error('Not found'));
    vi.mocked(membersApi.getMemberDues).mockResolvedValue([]);
    vi.mocked(membersApi.getMemberStockSubscriptions).mockResolvedValue([]);
    vi.mocked(membersApi.getMemberLoans).mockResolvedValue([]);
    vi.mocked(membersApi.getMemberPayments).mockResolvedValue([]);
    vi.mocked(stocksApi.getStocks).mockResolvedValue([]);

    await store.fetchMemberFinancialData('mem-1');

    expect(store.activeMeeting).toBeNull();
    expect(store.hasActiveMeeting).toBe(false);
    expect(store.loading).toBe(false);
  });

  it('should set error state and rethrow when a primary API fails', async () => {
    const store = useMemberPortalStore();

    vi.mocked(meetingsApi.getActiveMeeting).mockResolvedValue(null);
    vi.mocked(membersApi.getMemberDues).mockRejectedValue(new Error('Network error'));
    vi.mocked(membersApi.getMemberStockSubscriptions).mockResolvedValue([]);
    vi.mocked(membersApi.getMemberLoans).mockResolvedValue([]);
    vi.mocked(membersApi.getMemberPayments).mockResolvedValue([]);
    vi.mocked(stocksApi.getStocks).mockResolvedValue([]);

    await expect(store.fetchMemberFinancialData('mem-1')).rejects.toThrow('Network error');

    expect(store.loading).toBe(false);
    expect(store.error).toBe('Network error');
  });

  it('refresh should force re-fetching of data', async () => {
    const store = useMemberPortalStore();

    vi.mocked(meetingsApi.getActiveMeeting).mockResolvedValue(null);
    vi.mocked(membersApi.getMemberDues).mockResolvedValue([]);
    vi.mocked(membersApi.getMemberStockSubscriptions).mockResolvedValue([]);
    vi.mocked(membersApi.getMemberLoans).mockResolvedValue([]);
    vi.mocked(membersApi.getMemberPayments).mockResolvedValue([]);
    vi.mocked(stocksApi.getStocks).mockResolvedValue([]);

    await store.fetchMemberFinancialData('mem-1');
    expect(membersApi.getMemberDues).toHaveBeenCalledTimes(1);

    await store.refresh('mem-1');
    expect(membersApi.getMemberDues).toHaveBeenCalledTimes(2);
  });

  it('should not perform fetch if memberId is empty', async () => {
    const store = useMemberPortalStore();

    await store.fetchMemberFinancialData('');

    expect(membersApi.getMemberDues).not.toHaveBeenCalled();
    expect(store.loading).toBe(false);
  });

  it('should handle stock subscriptions when stocksApi fails or has missing stocks', async () => {
    const store = useMemberPortalStore();

    const mockSubscriptions = [
      {
        id: 'sub-1',
        stock_id: 'unknown-stock',
        stock_type: 'Acción Desconocida',
        quantity: 4,
        purchase_date: '2026-01-10',
        status: 'active',
      },
    ];

    vi.mocked(meetingsApi.getActiveMeeting).mockResolvedValue(null);
    vi.mocked(membersApi.getMemberDues).mockResolvedValue([]);
    vi.mocked(membersApi.getMemberStockSubscriptions).mockResolvedValue(mockSubscriptions);
    vi.mocked(membersApi.getMemberLoans).mockResolvedValue([]);
    vi.mocked(membersApi.getMemberPayments).mockResolvedValue([]);
    vi.mocked(stocksApi.getStocks).mockRejectedValue(new Error('Stocks failed'));

    await store.fetchMemberFinancialData('mem-1');

    expect(store.groupedStockSubscriptions).toHaveLength(1);
    expect(store.groupedStockSubscriptions[0].unit_value).toBe(0);
    expect(store.groupedStockSubscriptions[0].total_value).toBe(0);
    expect(store.totalCapital).toBe(0);
    expect(store.totalSharesCount).toBe(4);
  });

  it('should filter out inactive loans with zero outstanding balance', async () => {
    const store = useMemberPortalStore();

    const mockLoans = [
      {
        id: 'loan-1',
        member_id: 'mem-1',
        loan_type: 'Préstamo Pagado',
        approved_amount: 500000,
        disbursed_amount: 500000,
        outstanding_balance: 0,
        monthly_payment_amount: 0,
        interest_rate: 0.02,
        term: 6,
        status: 'paid',
        creation_date: '2026-01-01',
      },
      {
        id: 'loan-2',
        member_id: 'mem-1',
        loan_type: 'Préstamo Activo',
        approved_amount: 300000,
        disbursed_amount: 300000,
        outstanding_balance: 150000,
        monthly_payment_amount: 50000,
        interest_rate: 0.02,
        term: 6,
        status: 'active',
        creation_date: '2026-02-01',
      },
    ];

    vi.mocked(meetingsApi.getActiveMeeting).mockResolvedValue(null);
    vi.mocked(membersApi.getMemberDues).mockResolvedValue([]);
    vi.mocked(membersApi.getMemberStockSubscriptions).mockResolvedValue([]);
    vi.mocked(membersApi.getMemberLoans).mockResolvedValue(mockLoans);
    vi.mocked(membersApi.getMemberPayments).mockResolvedValue([]);
    vi.mocked(stocksApi.getStocks).mockResolvedValue([]);

    await store.fetchMemberFinancialData('mem-1');

    expect(store.activeLoans).toHaveLength(1);
    expect(store.activeLoans[0].id).toBe('loan-2');
    expect(store.totalDebt).toBe(150000);
  });

  it('should return all payments in recentPayments when fewer than 3 payments exist', async () => {
    const store = useMemberPortalStore();

    const mockPayments = [
      {
        operation_id: 'op-1',
        type: 'meeting_payment',
        total_amount: 100000,
        date: '2026-09-15',
        meeting_id: 'meet-1',
        entries: [],
      },
    ];

    vi.mocked(meetingsApi.getActiveMeeting).mockResolvedValue(null);
    vi.mocked(membersApi.getMemberDues).mockResolvedValue([]);
    vi.mocked(membersApi.getMemberStockSubscriptions).mockResolvedValue([]);
    vi.mocked(membersApi.getMemberLoans).mockResolvedValue([]);
    vi.mocked(membersApi.getMemberPayments).mockResolvedValue(mockPayments);
    vi.mocked(stocksApi.getStocks).mockResolvedValue([]);

    await store.fetchMemberFinancialData('mem-1');

    expect(store.recentPayments).toHaveLength(1);
    expect(store.totalHistoricalPaid).toBe(100000);
  });

  it('reset should restore initial values', () => {
    const store = useMemberPortalStore();
    store.error = 'Some error';
    store.loading = true;

    store.reset();

    expect(store.error).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.activeMeeting).toBeNull();
    expect(store.dues).toEqual([]);
    expect(store.stockSubscriptions).toEqual([]);
    expect(store.stocks).toEqual([]);
    expect(store.loans).toEqual([]);
    expect(store.payments).toEqual([]);
  });
});

