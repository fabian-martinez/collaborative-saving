import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { useMemberDetailStore } from '@/features/members/stores/memberDetail'
import {
  formatDueOrPaymentType,
  formatAccountType,
  addOneMonth
} from '@/features/members/utils/memberLabels'
import MemberDetailView from '@/features/members/views/MemberDetailView.vue'
import { membersApi } from '@/api/members.api'
import { ledgerApi } from '@/api/ledger.api'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'member-1' } }),
  useRouter: () => ({ push: vi.fn() })
}))

vi.mock('@/features/meetings/stores/activeMeeting', () => ({
  useActiveMeetingStore: () => ({
    meetingId: null,
    fetchActiveMeeting: vi.fn().mockResolvedValue(null)
  })
}))

describe('memberLabels helpers', () => {
  it('translates technical due/payment types to Spanish', () => {
    expect(formatDueOrPaymentType('mandatory_contribution')).toBe('Aporte obligatorio')
    expect(formatDueOrPaymentType('stock_fee')).toBe('Cuota de acción')
    expect(formatDueOrPaymentType('loan_payment')).toBe('Pago de préstamo')
    expect(formatDueOrPaymentType('unknown_key')).toBe('unknown_key')
  })

  it('translates account types to Spanish', () => {
    expect(formatAccountType('INSURANCE_INCOME')).toBe('Seguro')
    expect(formatAccountType('STOCK_CAPITAL')).toBe('Capital de Acciones')
    expect(formatAccountType('LOANS_RECEIVABLE')).toBe('Préstamos por Cobrar')
  })

  it('adds one calendar month accurately', () => {
    const next = addOneMonth('2026-11-24T12:00:00Z')
    expect(next.getMonth()).toBe(11) // December (0-indexed)
    expect(next.getDate()).toBe(24)
  })
})

describe('useMemberDetailStore dashboard metrics', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('computes accumulatedInsurance, memberAccountsSummary, totalStockUnits, and nextDueInfo', () => {
    const store = useMemberDetailStore()

    store.stockSubscriptions = [
      {
        id: 'sub-1',
        stock_id: 's-1',
        stock_type: 'Bono Navideño 2026',
        quantity: 21,
        purchase_date: '2026-01-10',
        status: 'active'
      },
      {
        id: 'sub-2',
        stock_id: 's-2',
        stock_type: 'Acciones Grandes',
        quantity: 1,
        purchase_date: '2026-02-10',
        status: 'active'
      }
    ]

    store.purchases = [
      {
        stock_subscription_id: 'sub-1',
        stock_id: 's-1',
        stock_type: 'Bono Navideño 2026',
        quantity: 21,
        unit_value: 50000,
        total_value: 1050000,
        purchase_date: '2026-01-10',
        meeting_id: 'm-1',
        operation_id: 'op-1'
      }
    ]

    store.dues = [
      {
        type: 'stock_fee',
        description: 'Cuota de acción: Bono Navideño 2026',
        amount: 1050000,
        reference_id: 'sub-1'
      }
    ]

    store.loans = [
      {
        id: 'loan-1',
        member_id: 'member-1',
        loan_type: 'corriente',
        approved_amount: 30000000,
        disbursed_amount: 30000000,
        outstanding_balance: 25522966,
        monthly_payment_amount: 420000,
        interest_rate: 1.5,
        term: 60,
        status: 'active',
        creation_date: '2026-01-01'
      }
    ]

    store.payments = [
      {
        operation_id: 'pay-1',
        type: 'loan_payment',
        total_amount: 217600,
        date: '2026-11-24T12:00:00Z',
        meeting_id: 'm-1',
        entries: []
      }
    ]

    store.ledgerEntries = [
      {
        id: 'le-1',
        operation_id: 'op-10',
        account_type: 'INSURANCE_INCOME',
        amount: -15000,
        created_at: '2026-11-24T12:00:00Z',
        description: 'Seguro de deuda'
      },
      {
        id: 'le-2',
        operation_id: 'op-11',
        account_type: 'INSURANCE_INCOME',
        amount: -30000,
        created_at: '2026-10-24T12:00:00Z',
        description: 'Seguro de deuda'
      },
      {
        id: 'le-3',
        operation_id: 'op-12',
        account_type: 'STOCK_CAPITAL',
        amount: -1050000,
        created_at: '2026-11-24T12:00:00Z',
        description: 'Aporte acciones'
      }
    ]

    expect(store.totalStockUnits).toBe(22)
    expect(store.accumulatedInsurance).toBe(45000)
    expect(store.memberAccountsSummary).toHaveLength(2)
    expect(store.memberAccountsSummary[0].accountType).toBe('INSURANCE_INCOME')
    expect(store.memberAccountsSummary[0].balance).toBe(45000)
    expect(store.nextDueInfo.amount).toBe(420000)
    expect((store.nextDueInfo.date as Date).getMonth()).toBe(11)

    const financials = store.getSubscriptionFinancials(store.stockSubscriptions[0])
    expect(financials.subscriptionValue).toBe(50000)
    expect(financials.currentFee).toBe(1050000)
  })
})

describe('MemberDetailView redesigned layout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.spyOn(membersApi, 'getMemberById').mockResolvedValue({
      id: 'member-1',
      name: 'SUAREZ FERNANDO',
      email: 'suarez.fernando@test.example.com',
      role: 'member',
      status: 'active',
      registration_date: '2025-08-30T00:00:00Z'
    })
    vi.spyOn(membersApi, 'getMemberDues').mockResolvedValue([])
    vi.spyOn(membersApi, 'getMemberPayments').mockResolvedValue([])
    vi.spyOn(membersApi, 'getMemberPurchases').mockResolvedValue([])
    vi.spyOn(membersApi, 'getMemberLoans').mockResolvedValue([])
    vi.spyOn(membersApi, 'getMemberStockSubscriptions').mockResolvedValue([])
    vi.spyOn(ledgerApi, 'getLedgerEntries').mockResolvedValue({
      data: [
        {
          id: 'le-1',
          operation_id: 'op-1',
          account_type: 'INSURANCE_INCOME',
          amount: -25000,
          created_at: '2026-11-24T12:00:00Z'
        }
      ],
      page: 1,
      limit: 500,
      total: 1
    })
  })

  it('renders 5 tabs, accumulated insurance without Recalcular button, and no payment/loan action buttons in sidebar', async () => {
    const wrapper = mount(MemberDetailView, {
      global: {
        stubs: {
          RegisterPaymentModal: true,
          StockSubscriptionDetail: true,
          PaymentDetailModal: true,
          EditLoanTermsModal: true,
          LoanBreakdownModal: true,
          MemberForm: true,
          Modal: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 20))

    const text = wrapper.text()
    expect(text).toContain('SUAREZ FERNANDO')
    expect(text).toContain('Editar')
    expect(text).toContain('Seguro Acumulado')
    expect(text).not.toContain('Recalcular')
    expect(text).not.toContain('+ Registrar Pago')
    expect(text).not.toContain('+ Nuevo Préstamo')
    expect(text).toContain('Resumen')
    expect(text).toContain('Préstamos y Cronograma')
    expect(text).toContain('Acciones')
    expect(text).toContain('Cuentas')
    expect(text).toContain('Movimientos')
  })
})

describe('TabLoansAndSchedule filtering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows only active loans by default and groups filter buttons by loan_type', async () => {
    const { default: TabLoansAndSchedule } = await import(
      '@/features/members/views/tabs/TabLoansAndSchedule.vue'
    )
    const store = useMemberDetailStore()
    store.loans = [
      {
        id: 'l-1',
        member_id: 'm-1',
        loan_type: 'accion',
        approved_amount: 100000,
        disbursed_amount: 100000,
        outstanding_balance: 50000,
        monthly_payment_amount: 10000,
        interest_rate: 1,
        term: 10,
        status: 'active',
        creation_date: '2026-01-01'
      },
      {
        id: 'l-2',
        member_id: 'm-1',
        loan_type: 'accion',
        approved_amount: 200000,
        disbursed_amount: 200000,
        outstanding_balance: 150000,
        monthly_payment_amount: 20000,
        interest_rate: 1,
        term: 10,
        status: 'active',
        creation_date: '2026-02-01'
      },
      {
        id: 'l-3',
        member_id: 'm-1',
        loan_type: 'corriente',
        approved_amount: 300000,
        disbursed_amount: 300000,
        outstanding_balance: 0,
        monthly_payment_amount: 30000,
        interest_rate: 1.5,
        term: 10,
        status: 'closed',
        creation_date: '2025-01-01'
      }
    ]

    const wrapper = mount(TabLoansAndSchedule, {
      props: { memberId: 'm-1', store }
    })

    const text = wrapper.text()
    expect(text).toContain('Todos (2)')
    expect(text).toContain('accion (2)')
    expect(text).not.toContain('corriente')
    expect(text).toContain('Ver detalle →')
  })
})

describe('LoanBreakdownModal principal-only monthly payment', () => {
  it('treats monthly_payment_amount as principal only and adds interest on top', async () => {
    const { default: LoanBreakdownModal } = await import(
      '@/features/members/components/LoanBreakdownModal.vue'
    )
    const wrapper = mount(LoanBreakdownModal, {
      props: {
        visible: true,
        loan: {
          id: 'l-1',
          member_id: 'm-1',
          loan_type: 'corriente',
          approved_amount: 1000000,
          disbursed_amount: 1000000,
          outstanding_balance: 500000,
          monthly_payment_amount: 100000,
          interest_rate: 2,
          term: 10,
          status: 'active',
          creation_date: '2026-01-01'
        },
        projectedPayments: []
      }
    })

    const text = wrapper.text()
    expect(text).toContain('Cuota (Solo Capital)')
    // principal = 100,000; interest = 500,000 * 2% = 10,000; total = 110,000
    expect(text).toContain('100.000')
    expect(text).toContain('10.000')
    expect(text).toContain('110.000')
  })
})
