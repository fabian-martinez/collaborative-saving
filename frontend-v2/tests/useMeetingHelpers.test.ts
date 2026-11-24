/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMeetingSummary } from '../src/features/meetings/composables/useMeetingSummary'
import { useMemberSelection } from '../src/features/meetings/composables/useMemberSelection'
import { usePaymentCollection } from '../src/features/meetings/composables/usePaymentCollection'
import { useActiveMeetingStore } from '../src/features/meetings/stores/activeMeeting'
import { operationsApi, type Operation, type LedgerEntry } from '../src/api/operations.api'
import { meetingsApi, type Meeting, type RevaluationResponse } from '../src/api/meetings.api'
import { stocksApi, type Stock } from '../src/api/stocks.api'
import { membersApi, type Member, type MemberPayment } from '../src/api/members.api'

/**
 * @vitest-environment jsdom
 */

const createEntry = (accountType: string, amount: number): LedgerEntry => ({
  id: `entry-${accountType}-${amount}`,
  operation_id: 'op-1',
  account_type: accountType,
  amount,
  created_at: '2026-01-15T10:00:00.000Z',
  description: null,
  loan_id: null,
  stock_id: null,
  mandatory_contribution_id: null,
  stock_subscription_id: null,
})

const createMember = (overrides: Partial<Member> = {}): Member => ({
  id: 'member-1',
  name: 'Carlos Alberto Mendoza',
  email: 'carlos@ejemplo.com',
  role: 'member',
  status: 'active',
  registration_date: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('useMeetingSummary', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('returns empty summary initially', () => {
    // ARRANGE
    const { summary, loading, error, meetingNumber } = useMeetingSummary()

    // ACT & ASSERT
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(meetingNumber.value).toBe(0)
    expect(summary.value.totalCollected).toBe(0)
    expect(summary.value.totalDisbursed).toBe(0)
    expect(summary.value.shareValue).toBe(0)
    expect(summary.value.participants).toBe(0)
    expect(summary.value.metrics.revaluation).toBeNull()
    expect(summary.value.memberOperations.size).toBe(0)
  })

  it('loads summary, hydrates missing entries, and computes collections, disbursements, participants, revaluation, and shareValue', async () => {
    // ARRANGE
    const opsFromList: Operation[] = [
      {
        id: 'op-1',
        member_id: 'm1',
        meeting_id: 'meeting-2',
        type: 'MONTHLY_PAYMENT',
        date: '2026-02-15',
        description: 'Pago mensual m1',
        entries: [
          createEntry('CASH', 150000),
          createEntry('INTEREST_INCOME', -20000),
          createEntry('FEE_INCOME', -5000),
        ],
      },
      {
        id: 'op-2',
        member_id: 'm1',
        meeting_id: 'meeting-2',
        type: 'LOAN_PAYMENT',
        date: '2026-02-15',
        description: 'Abono préstamo m1',
        entries: [], // Missing entries -> triggers getOperationById
      },
      {
        id: 'op-3',
        member_id: 'm2',
        meeting_id: 'meeting-2',
        type: 'LOAN_DISBURSEMENT',
        date: '2026-02-15',
        description: 'Desembolso m2',
        entries: [createEntry('CASH', -200000)],
      },
      {
        id: 'op-4',
        member_id: 'm3',
        meeting_id: 'meeting-2',
        type: 'STOCK_WITHDRAWAL',
        date: '2026-02-15',
        description: 'Retiro acciones m3',
        entries: [createEntry('CASH', -50000)],
      },
      {
        id: 'op-5',
        member_id: null,
        meeting_id: 'meeting-2',
        type: 'DIVIDEND_PAYMENT',
        date: '2026-02-15',
        description: 'Pago dividendos',
        entries: [createEntry('CASH', -30000)],
      },
      {
        id: 'op-6',
        member_id: 'm4',
        meeting_id: 'meeting-2',
        type: 'MONTHLY_PAYMENT',
        date: '2026-02-15',
        description: 'Pago sin entries fallido',
        entries: undefined,
      },
    ]

    vi.spyOn(operationsApi, 'getOperations').mockResolvedValue({
      data: opsFromList,
      page: 1,
      limit: 1000,
      total: 6,
    })
    vi.spyOn(operationsApi, 'getOperationById')
      .mockResolvedValueOnce({
        ...opsFromList[1],
        entries: [createEntry('CASH', 80000), createEntry('INTEREST_INCOME', -10000)],
      })
      .mockRejectedValueOnce(new Error('Not found'))

    const meetings: Meeting[] = [
      { id: 'meeting-1', date: '2026-01-15', status: 'closed', notes: null, created_at: '2026-01-15' },
      { id: 'meeting-3', date: '2026-03-15', status: 'active', notes: null, created_at: '2026-03-15' },
      { id: 'meeting-2', date: '2026-02-15', status: 'closed', notes: null, created_at: '2026-02-15' },
    ]
    vi.spyOn(meetingsApi, 'getMeetings').mockResolvedValue(meetings)

    const revaluation: RevaluationResponse = {
      total_contributions: 100000,
      total_interest: 30000,
      total_to_distribute: 30000,
      total_mandatory_contributions: 0,
      status: 'executed',
      details: [
        {
          stock_id: 's1',
          type: 'Ordinaria',
          is_guaranteed: false,
          total_shares: 10,
          previous_value: 100000,
          growth_from_contributions: 0,
          growth_from_interest: 10000,
          total_growth_per_share: 10000,
          estimated_growth_from_contributions: 0,
          new_value: 110000,
        },
        {
          stock_id: 's2',
          type: 'Preferencial',
          is_guaranteed: true,
          total_shares: 10,
          previous_value: 200000,
          growth_from_contributions: 0,
          growth_from_interest: 20000,
          total_growth_per_share: 20000,
          estimated_growth_from_contributions: 0,
          new_value: 220000,
        },
      ],
    }
    vi.spyOn(meetingsApi, 'getRevaluationPreview').mockResolvedValue(revaluation)

    const stocks: Stock[] = [
      { id: 's1', name: 'S1', type: 'S1', value: 110000, monthly_contribution: 50000, is_guaranteed: false, behavior: 'CAPITAL_APPRECIATION', created_at: '2026-01-01' },
      { id: 's2', name: 'S2', type: 'S2', value: 220000, monthly_contribution: 50000, is_guaranteed: true, behavior: 'DIVIDEND_YIELD', created_at: '2026-01-01' },
    ]
    vi.spyOn(stocksApi, 'getStocks').mockResolvedValue(stocks)

    const composable = useMeetingSummary()

    // ACT
    await composable.loadSummary('meeting-2')

    // ASSERT
    expect(operationsApi.getOperations).toHaveBeenCalledWith({
      meeting_id: 'meeting-2',
      limit: 1000,
      order_by: 'ASC',
    })
    expect(operationsApi.getOperationById).toHaveBeenCalledTimes(2)
    expect(composable.meetingNumber.value).toBe(2) // meeting-3 is 1st, meeting-2 is 2nd
    expect(composable.loading.value).toBe(false)
    expect(composable.error.value).toBeNull()

    const s = composable.summary.value
    expect(s.totalCollected).toBe(230000) // 150000 + 80000
    expect(s.totalDisbursed).toBe(280000) // 200000 + 50000 + 30000
    expect(s.participants).toBe(4) // m1, m2, m3, m4 (ignores null)
    expect(s.shareValue).toBe(165000) // (110000 + 220000) / 2
    expect(s.collections).toEqual({
      memberContributions: { count: 2, amount: 150000 },
      loanPayments: { count: 1, amount: 80000 },
      interestCollected: 30000,
      feesCollected: 5000,
    })
    expect(s.disbursements).toEqual({
      newLoans: { count: 1, amount: 200000 },
      stockLiquidations: { count: 1, amount: 50000 },
      dividendPayments: { count: 1, amount: 30000 },
    })
    expect(s.metrics.revaluation).toEqual({
      previousValue: 150000,
      newValue: 165000,
      percentage: 10,
    })
    expect(s.memberOperations.get('m1')).toHaveLength(2)
    expect(s.memberOperations.get('m2')).toHaveLength(1)
  })

  it('handles revaluation error, empty stocks, and zero previous_value gracefully', async () => {
    // ARRANGE
    vi.spyOn(operationsApi, 'getOperations').mockResolvedValue({
      data: [
        {
          id: 'op-1',
          member_id: 'm1',
          meeting_id: 'meeting-x',
          type: 'MONTHLY_PAYMENT',
          date: '2026-02-15',
          description: null,
          entries: [createEntry('CASH', 50000)],
        },
      ],
      page: 1,
      limit: 1000,
      total: 1,
    })
    vi.spyOn(meetingsApi, 'getMeetings').mockResolvedValue([])
    vi.spyOn(meetingsApi, 'getRevaluationPreview').mockRejectedValueOnce(new Error('No revaluation'))
    vi.spyOn(stocksApi, 'getStocks').mockRejectedValueOnce(new Error('Stocks failed'))

    const composable = useMeetingSummary()

    // ACT
    await composable.loadSummary('meeting-x')

    // ASSERT
    expect(composable.meetingNumber.value).toBe(0)
    expect(composable.summary.value.metrics.revaluation).toBeNull()
    expect(composable.summary.value.shareValue).toBe(0)

    // Test zero previousValue percentage edge case and empty stocks
    vi.spyOn(meetingsApi, 'getRevaluationPreview').mockResolvedValueOnce({
      total_contributions: 0,
      total_interest: 0,
      total_to_distribute: 0,
      total_mandatory_contributions: 0,
      status: 'preview',
      details: [
        {
          stock_id: 's1',
          type: 'Nueva',
          is_guaranteed: false,
          total_shares: 0,
          previous_value: 0,
          growth_from_contributions: 0,
          growth_from_interest: 0,
          total_growth_per_share: 0,
          estimated_growth_from_contributions: 0,
          new_value: 1000,
        },
      ],
    })
    vi.spyOn(stocksApi, 'getStocks').mockResolvedValueOnce([])

    await composable.loadSummary('meeting-x')
    expect(composable.summary.value.metrics.revaluation?.percentage).toBe(0)
    expect(composable.summary.value.shareValue).toBe(0)
  })

  it('sets error and resets loading when operationsApi.getOperations fails', async () => {
    // ARRANGE
    vi.spyOn(operationsApi, 'getOperations').mockRejectedValueOnce(new Error('API error'))
    const composable = useMeetingSummary()

    // ACT
    await composable.loadSummary('meeting-1')

    // ASSERT
    expect(composable.error.value).toBe('API error')
    expect(composable.loading.value).toBe(false)

    // Non-Error rejection
    vi.spyOn(operationsApi, 'getOperations').mockRejectedValueOnce('raw')
    await composable.loadSummary('meeting-1')
    expect(composable.error.value).toBe('Error al cargar resumen de reunión')
  })
})

describe('useMemberSelection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('computes selectedMember, printDate, viewedTotal, getInitials, and deterministic getMemberColor', () => {
    // ARRANGE
    const paymentCollection = usePaymentCollection()
    const selection = useMemberSelection(paymentCollection)
    const m1 = createMember({ id: 'm1', name: 'Juan' })
    const m2 = createMember({ id: 'm2', name: '  María Fernanda   López  ' })
    selection.members.value = [m1, m2]

    // ASSERT initial computed values
    expect(selection.selectedMember.value).toBeNull()
    expect(selection.viewedTotal.value).toBe(0)
    expect(selection.printDate.value).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)

    // Helpers
    expect(selection.getInitials('Juan')).toBe('J')
    expect(selection.getInitials('  María Fernanda   López  ')).toBe('ML')
    const colorA = selection.getMemberColor('member-123')
    const colorB = selection.getMemberColor('member-123')
    expect(colorA).toBe(colorB)
    expect(colorA).toMatch(/^#[0-9a-f]{6}$/i)

    // Viewed operations computed
    selection.viewedOperations.value = [
      {
        date: '2026-03-10T12:00:00.000Z',
        ledger_entries: [
          { account_type: 'CASH', amount: 120000 },
          { account_type: 'STOCK_PORTFOLIO', amount: -120000 },
        ],
      },
    ]
    expect(selection.viewedTotal.value).toBe(120000)
    expect(selection.printDate.value).not.toBe('N/A')
  })

  it('loads members, fetches active meeting when missing, and fetches meeting payments', async () => {
    // ARRANGE
    const store = useActiveMeetingStore()
    const members = [createMember({ id: 'm1', name: 'Socio 1' })]

    vi.spyOn(membersApi, 'getMembers').mockResolvedValue(members)
    vi.spyOn(meetingsApi, 'getActiveMeeting').mockResolvedValue({
      id: 'meeting-active',
      date: '2026-02-01',
      status: 'active',
      notes: null,
      created_at: '2026-02-01',
    })
    vi.spyOn(meetingsApi, 'getMeetingPayments').mockResolvedValue([
      {
        id: 'op-1',
        member_id: 'm1',
        meeting_id: 'meeting-active',
        type: 'MONTHLY_PAYMENT',
        date: '2026-02-01',
        total_amount: 90000,
      },
    ])

    const paymentCollection = usePaymentCollection()
    const selection = useMemberSelection(paymentCollection)

    // Pre-populate selection to verify loadMembers clears it
    paymentCollection.selectedMember.value = members[0]
    selection.viewedOperations.value = [{ id: 'old' }]

    // ACT
    await selection.loadMembers()

    // ASSERT
    expect(membersApi.getMembers).toHaveBeenCalledTimes(1)
    expect(meetingsApi.getActiveMeeting).toHaveBeenCalledTimes(1)
    expect(store.meetingId).toBe('meeting-active')
    expect(paymentCollection.paidMemberIds.value).toEqual(['m1'])
    expect(selection.members.value).toEqual(members)
    expect(selection.selectedMember.value).toBeNull()
    expect(selection.viewedOperations.value).toBeNull()
    expect(selection.loadingMembers.value).toBe(false)
    expect(selection.error.value).toBeNull()
  })

  it('sets error when loadMembers fails', async () => {
    // ARRANGE
    vi.spyOn(membersApi, 'getMembers').mockRejectedValueOnce(new Error('No se pudieron cargar'))
    const paymentCollection = usePaymentCollection()
    const selection = useMemberSelection(paymentCollection)

    // ACT
    await selection.loadMembers()

    // ASSERT
    expect(selection.error.value).toBe('No se pudieron cargar')
    expect(selection.loadingMembers.value).toBe(false)

    vi.spyOn(membersApi, 'getMembers').mockRejectedValueOnce('raw')
    await selection.loadMembers()
    expect(selection.error.value).toBe('Error al cargar miembros')
  })

  it('selectMember uses cached operations for paid member without calling API and updates completedPayments', async () => {
    // ARRANGE
    const store = useActiveMeetingStore()
    store.meeting = { id: 'meeting-1', date: '2026-02-01', status: 'active', notes: null, created_at: '2026-02-01' }

    const paymentCollection = usePaymentCollection()
    const m1 = createMember({ id: 'm1', name: 'Socio Pagado' })
    const m2 = createMember({ id: 'm2', name: 'Otro Socio' })
    paymentCollection.paidMemberIds.value = ['m1']
    const cachedOps = [
      {
        id: 'op-cached',
        date: '2026-02-01',
        ledger_entries: [{ account_type: 'CASH', amount: 75000 }],
      },
    ]
    paymentCollection.paidMemberOperations.value.set('m1', cachedOps)
    paymentCollection.completedPayments.value = [{ memberName: 'Socio Pagado', amount: 1000 }]

    const getPaymentsSpy = vi.spyOn(membersApi, 'getMemberPayments')
    const resetSpy = vi.spyOn(paymentCollection, 'reset')

    const selection = useMemberSelection(paymentCollection)
    selection.members.value = [m1, m2]

    // First select m2 (unpaid) so switching to m1 triggers reset()
    vi.spyOn(membersApi, 'getMemberDues').mockResolvedValue([])
    vi.spyOn(membersApi, 'getMemberInsurance').mockResolvedValue({ insurance_amount: 0 })
    await selection.selectMember(m2)
    expect(selection.selectedMember.value).toEqual(m2)

    // ACT: select paid member m1 with cache
    await selection.selectMember(m1)

    // ASSERT
    expect(resetSpy).toHaveBeenCalledTimes(1)
    expect(getPaymentsSpy).not.toHaveBeenCalled()
    expect(selection.viewedOperations.value).toEqual(cachedOps)
    expect(paymentCollection.completedPayments.value).toEqual([
      { memberName: 'Socio Pagado', amount: 75000 },
    ])
  })

  it('selectMember fetches and caches payments for paid member without cache, and handles API fallback', async () => {
    // ARRANGE
    const store = useActiveMeetingStore()
    store.meeting = { id: 'meeting-1', date: '2026-02-01', status: 'active', notes: null, created_at: '2026-02-01' }

    const paymentCollection = usePaymentCollection()
    const m1 = createMember({ id: 'm1', name: 'Socio 1' })
    const m2 = createMember({ id: 'm2', name: 'Socio Error' })
    paymentCollection.paidMemberIds.value = ['m1', 'm2']

    const apiPayments: MemberPayment[] = [
      {
        operation_id: 'op-100',
        type: 'monthly_payment',
        total_amount: 110000,
        date: '2026-02-01T10:00:00Z',
        meeting_id: 'meeting-1',
        entries: [{ type: 'CASH', amount: 110000 }],
      },
    ]
    vi.spyOn(membersApi, 'getMemberPayments')
      .mockResolvedValueOnce(apiPayments)
      .mockRejectedValueOnce(new Error('Network fail'))

    const selection = useMemberSelection(paymentCollection)
    selection.members.value = [m1, m2]

    // ACT: paid member m1 without cache
    await selection.selectMember(m1)

    // ASSERT
    expect(membersApi.getMemberPayments).toHaveBeenCalledWith('m1', {
      meeting_id: 'meeting-1',
      type: 'monthly_payment',
    })
    expect(selection.viewedOperations.value).toHaveLength(1)
    expect(paymentCollection.paidMemberOperations.value.get('m1')).toHaveLength(1)
    expect(paymentCollection.completedPayments.value).toEqual([
      { memberName: 'Socio 1', amount: 110000 },
    ])

    // ACT: paid member m2 when API fails falls back to empty operations when cache is empty
    await selection.selectMember(m2)
    expect(selection.viewedOperations.value).toEqual([])

    // ACT: paid member m2 when API fails with fallback operations populated during failure updates completedPayments
    const fallbackOps = [
      {
        id: 'op-fallback',
        date: '2026-02-01',
        ledger_entries: [{ account_type: 'CASH', amount: 45000 }],
      },
    ]
    vi.spyOn(membersApi, 'getMemberPayments').mockImplementationOnce(async () => {
      paymentCollection.paidMemberOperations.value.set('m2', fallbackOps)
      throw new Error('Late failure')
    })
    await selection.selectMember(m2)
    expect(selection.viewedOperations.value).toEqual(fallbackOps)
    expect(paymentCollection.completedPayments.value).toContainEqual({
      memberName: 'Socio Error',
      amount: 45000,
    })
  })

  it('selectMember loads dues for unpaid member and clearSelection resets everything', async () => {
    // ARRANGE
    const store = useActiveMeetingStore()
    store.meeting = { id: 'meeting-1', date: '2026-02-01', status: 'active', notes: null, created_at: '2026-02-01' }

    const paymentCollection = usePaymentCollection()
    const m1 = createMember({ id: 'm1', name: 'Socio Nuevo' })
    vi.spyOn(membersApi, 'getMemberDues').mockResolvedValue([
      { type: 'mandatory_contribution', description: 'Aporte', amount: 20000 },
    ])
    vi.spyOn(membersApi, 'getMemberInsurance').mockResolvedValue({ insurance_amount: 0 })

    const selection = useMemberSelection(paymentCollection)
    selection.members.value = [m1]

    // ACT
    await selection.selectMember(m1)

    // ASSERT
    expect(membersApi.getMemberDues).toHaveBeenCalledWith('m1')
    expect(paymentCollection.memberDues.value).toHaveLength(1)
    expect(selection.selectedMember.value).toEqual(m1)

    // ACT: clearSelection
    selection.clearSelection()

    // ASSERT
    expect(selection.selectedMember.value).toBeNull()
    expect(paymentCollection.selectedMember.value).toBeNull()
    expect(selection.viewedOperations.value).toBeNull()
    expect(paymentCollection.memberDues.value).toEqual([])
    expect(paymentCollection.payments.value).toEqual([])
  })
})
