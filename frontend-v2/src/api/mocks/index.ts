import type { Member, MemberDue, MemberPayment, MemberPurchase } from '../members.api'
import type { Meeting, Operation as MeetingOperation } from '../meetings.api'
import type { Loan } from '../loans.api'
import type { Stock } from '../stocks.api'
import type { MandatoryContribution } from '../contributions.api'
import type { LedgerEntry, AccountTypeOption, AccountsSummary } from '../ledger.api'
import type { PaginatedResponse } from '../types'
import type { Operation, GetOperationsQuery } from '../operations.api'

// Datos mock
const mockMembers: Member[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan.perez@example.com',
    role: 'member',
    identification_number: '1234567890',
    status: 'active',
    address: 'Calle 123, Ciudad',
    phone: '+57 300 123 4567',
    beneficiary: 'María Pérez',
    registration_date: '2024-01-15T10:30:00Z',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'María García',
    email: 'maria.garcia@example.com',
    role: 'member',
    status: 'active',
    registration_date: '2024-02-20T14:20:00Z',
    created_at: '2024-02-20T14:20:00Z'
  },
  {
    id: '3',
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@example.com',
    role: 'member',
    identification_number: '9876543210',
    status: 'active',
    phone: '+57 300 987 6543',
    registration_date: '2024-03-10T09:15:00Z',
    created_at: '2024-03-10T09:15:00Z'
  }
]

const mockMeetings: Meeting[] = [
  {
    id: '1',
    date: '2024-12-15T10:00:00Z',
    status: 'active',
    notes: 'Reunión mensual de diciembre',
    created_at: '2024-12-15T10:00:00Z',
    summary: {
      total_cash: 3500000,
      total_interest: 420000,
      total_collected: 6050000,
      total_stock_investment: 4250000,
      total_loans: 1800000,
      final_cash_balance: 2120000,
      total_disbursed: 1800000,
      participants_count: 12,
      duration: '2h 15m'
    }
  },
  {
    id: '2',
    date: '2024-11-15T10:00:00Z',
    status: 'closed',
    notes: 'Reunión mensual de noviembre',
    created_at: '2024-11-15T10:00:00Z'
  }
]

const mockLoans: Loan[] = [
  {
    id: '1',
    member_id: '1',
    loan_type: 'corriente',
    approved_amount: 2000000,
    disbursed_amount: 2000000,
    outstanding_balance: 1500000,
    monthly_payment_amount: 200000,
    interest_rate: 0.05,
    term: 12,
    status: 'active',
    creation_date: '2024-06-01T10:00:00Z'
  },
  {
    id: '2',
    member_id: '2',
    loan_type: 'agil',
    approved_amount: 1000000,
    disbursed_amount: 1000000,
    outstanding_balance: 800000,
    monthly_payment_amount: 150000,
    interest_rate: 0.06,
    term: 8,
    status: 'active',
    creation_date: '2024-07-01T10:00:00Z'
  }
]

const mockStocks: Stock[] = [
  {
    id: '1',
    type: 'Acción A',
    value: 100000,
    monthly_contribution: 50000,
    is_guaranteed: true,
    guaranteed_yield: 0.05,
    behavior: 'CAPITAL_APPRECIATION',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    type: 'Acción B',
    value: 200000,
    monthly_contribution: 75000,
    is_guaranteed: false,
    guaranteed_yield: null,
    behavior: 'DIVIDEND_YIELD',
    created_at: '2024-02-20T14:20:00Z'
  }
]

const mockContributions: MandatoryContribution[] = [
  {
    id: '1',
    asset_type: 'cash',
    value: 50000
  },
  {
    id: '2',
    asset_type: 'investment',
    value: 100000
  }
]

const mockLedgerEntries: LedgerEntry[] = [
  {
    id: '1',
    operation_id: 'op1',
    account_type: 'CASH',
    amount: 150000,
    description: 'Aporte obligatorio',
    created_at: '2024-12-15T10:30:00Z',
    operation_type: 'MANDATORY_CONTRIBUTION',
    operation_description: 'Aporte mensual',
    member_id: '1',
    member_name: 'Juan Pérez',
    meeting_id: '1',
    meeting_date: '2024-12-15T10:00:00Z'
  },
  {
    id: '2',
    operation_id: 'op2',
    account_type: 'INTEREST_INCOME',
    amount: 80000,
    description: 'Intereses de préstamos',
    created_at: '2024-12-15T11:00:00Z',
    operation_type: 'LOAN_PAYMENT',
    operation_description: 'Pago mensual de préstamo',
    member_id: '1',
    member_name: 'Juan Pérez',
    meeting_id: '1',
    meeting_date: '2024-12-15T10:00:00Z'
  },
  {
    id: '3',
    operation_id: 'op3',
    account_type: 'LOAN_PORTFOLIO',
    amount: -1200000,
    description: 'Desembolso de préstamo',
    created_at: '2024-12-15T11:30:00Z',
    operation_type: 'LOAN_DISBURSEMENT',
    operation_description: 'Desembolso de préstamo',
    member_id: '2',
    member_name: 'María García',
    meeting_id: '1',
    meeting_date: '2024-12-15T10:00:00Z',
    loan_id: '2'
  },
  {
    id: '4',
    operation_id: 'op4',
    account_type: 'STOCK_PORTFOLIO',
    amount: 200000,
    description: 'Compra de acciones',
    created_at: '2024-12-15T12:00:00Z',
    operation_type: 'STOCK_PURCHASE',
    operation_description: 'Compra de acciones',
    member_id: '1',
    member_name: 'Juan Pérez',
    meeting_id: '1',
    meeting_date: '2024-12-15T10:00:00Z',
    stock_id: '1'
  }
]

// Función helper para simular delay
function delay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Mocks de API
export const mockApi = {
  // Members
  async getMembers(): Promise<Member[]> {
    await delay()
    return [...mockMembers]
  },

  async getMemberById(id: string): Promise<Member> {
    await delay()
    const member = mockMembers.find(m => m.id === id)
    if (!member) throw new Error('Member not found')
    return { ...member }
  },

  async createMember(data: any): Promise<Member> {
    await delay()
    const newMember: Member = {
      id: String(mockMembers.length + 1),
      ...data,
      status: 'active',
      registration_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
    mockMembers.push(newMember)
    return newMember
  },

  async updateMember(id: string, data: any): Promise<Member> {
    await delay()
    const member = mockMembers.find(m => m.id === id)
    if (!member) throw new Error('Member not found')
    Object.assign(member, data)
    return { ...member }
  },

  async deleteMember(id: string): Promise<void> {
    await delay()
    const index = mockMembers.findIndex(m => m.id === id)
    if (index === -1) throw new Error('Member not found')
    mockMembers.splice(index, 1)
  },

  async getMemberDues(_memberId: string): Promise<MemberDue[]> {
    await delay()
    return [
      {
        type: 'MANDATORY_CONTRIBUTION',
        description: 'Aporte obligatorio mensual',
        amount: 50000,
        monthly_contribution: 50000
      },
      {
        type: 'LOAN_PAYMENT',
        description: 'Pago de préstamo',
        amount: 200000,
        reference_id: 'loan-1',
        details: {
          interest: 10000,
          principal: 190000,
          outstanding_balance: 1500000
        }
      }
    ]
  },

  async getMemberInsurance(_memberId: string): Promise<{ insurance_amount: number }> {
    await delay()
    return { insurance_amount: 5000 }
  },

  async recordMonthlyPayment(_memberId: string, data: any): Promise<any> {
    await delay()
    return {
      operation_id: 'op-new',
      total_amount: data.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
    }
  },

  async recordExtraordinaryLoanPayment(_memberId: string, data: any): Promise<any> {
    await delay()
    return {
      loanId: data.loanId,
      operationId: 'op-extraordinary-payment',
      interestPaid: 0,
      principalPaid: data.amount,
      newOutstandingBalance: 1000000 - data.amount,
      loanStatus: 'active',
      transactionDetailIds: ['detail1'],
    }
  },

  async getMemberPayments(_memberId: string): Promise<MemberPayment[]> {
    await delay()
    return [
      {
        operation_id: 'op1',
        type: 'monthly_payment',
        total_amount: 250000,
        description: 'Pago mensual',
        date: '2024-12-15T10:30:00Z',
        meeting_id: '1',
        entries: [
          { type: 'MANDATORY_CONTRIBUTION', amount: 50000 },
          { type: 'LOAN_PAYMENT', amount: 200000 }
        ]
      }
    ]
  },

  async getMemberPurchases(_memberId: string): Promise<MemberPurchase[]> {
    await delay()
    return [
      {
        stock_subscription_id: 'sub1',
        stock_id: '1',
        stock_type: 'Acción A',
        quantity: 2,
        unit_value: 100000,
        total_value: 200000,
        purchase_date: '2024-12-15T10:30:00Z',
        meeting_id: '1',
        operation_id: 'op3',
        loan: null
      }
    ]
  },

  async createStockPurchase(_memberId: string, data: any): Promise<any> {
    await delay()
    return {
      operation_id: 'op-new-purchase',
      stock_subscription_id: 'sub-new',
      loan_id: data.loan_details ? 'loan-new' : undefined
    }
  },

  async getMemberExchanges(_memberId: string): Promise<any[]> {
    await delay()
    return []
  },

  async getMemberStockSubscriptions(_memberId: string): Promise<any[]> {
    await delay()
    return [
      {
        id: 'sub1',
        stock_id: '1',
        stock_type: 'Acción A',
        quantity: 2,
        purchase_date: '2024-12-15T10:30:00Z',
        status: 'active',
        financing_loan_id: null
      },
      {
        id: 'sub2',
        stock_id: '2',
        stock_type: 'Acción B',
        quantity: 5,
        purchase_date: '2024-11-20T10:30:00Z',
        status: 'active',
        financing_loan_id: null
      }
    ]
  },

  async getMemberTransfers(_memberId: string): Promise<any[]> {
    await delay()
    return []
  },

  async getMemberStockLoanPayments(_memberId: string): Promise<any[]> {
    await delay()
    return []
  },

  async processStockExchange(_memberId: string, _data: any): Promise<any> {
    await delay()
    return { operation_id: 'op-exchange', message: 'Exchange processed' }
  },

  async processStockTransfer(_memberId: string, _data: any): Promise<any> {
    await delay()
    return { operation_id: 'op-transfer', message: 'Transfer processed' }
  },

  async processStockLoanPayment(_memberId: string, _data: any): Promise<any> {
    await delay()
    return { operation_id: 'op-loan-payment', message: 'Loan payment processed' }
  },

  async getMemberPaymentSchedule(_memberId: string): Promise<any> {
    await delay()
    return {
      items: [
        { due_date: '2025-01-15', type: 'MANDATORY_CONTRIBUTION', amount: 50000 },
        { due_date: '2025-01-15', type: 'LOAN_PAYMENT', amount: 200000 }
      ],
      total_amount: 250000
    }
  },

  // Meetings
  async getMeetings(): Promise<Meeting[]> {
    await delay()
    return [...mockMeetings]
  },

  async getMeetingById(id: string): Promise<Meeting> {
    await delay()
    const meeting = mockMeetings.find(m => m.id === id)
    if (!meeting) throw new Error('Meeting not found')
    return { ...meeting }
  },

  async getActiveMeeting(): Promise<Meeting> {
    await delay()
    const active = mockMeetings.find(m => m.status === 'active')
    if (!active) throw new Error('No active meeting')
    return { ...active }
  },

  async createMeeting(data: any): Promise<Meeting> {
    await delay()
    const newMeeting: Meeting = {
      id: String(mockMeetings.length + 1),
      date: data.date || new Date().toISOString(),
      status: 'active',
      notes: data.notes || null,
      created_at: new Date().toISOString()
    }
    mockMeetings.unshift(newMeeting)
    return newMeeting
  },

  async closeMeeting(id: string): Promise<Meeting> {
    await delay()
    const meeting = mockMeetings.find(m => m.id === id)
    if (!meeting) throw new Error('Meeting not found')
    meeting.status = 'closed'
    return { ...meeting }
  },

  async getMeetingPayments(meetingId: string): Promise<MeetingOperation[]> {
    await delay()
    // Retornar operaciones de múltiples miembros para el mock
    return [
      {
        id: 'op1',
        member_id: '1',
        meeting_id: meetingId,
        type: 'monthly_payment',
        description: 'Pago mensual',
        date: '2024-12-15T10:30:00Z',
        total_amount: 100000,
      },
      {
        id: 'op2',
        member_id: '2',
        meeting_id: meetingId,
        type: 'monthly_payment',
        description: 'Pago mensual',
        date: '2024-12-15T10:30:00Z',
        total_amount: 150000,
      },
    ]
  },

  async getMeetingPurchases(_meetingId: string): Promise<MeetingOperation[]> {
    await delay()
    const purchases = await mockApi.getMemberPurchases('1')
    // Convertir MemberPurchase[] a Operation[]
    return purchases.map(purchase => ({
      id: purchase.operation_id,
      member_id: '1', // Mock member ID
      meeting_id: purchase.meeting_id,
      type: 'STOCK_PURCHASE',
      description: `Compra de ${purchase.stock_type} - ${purchase.quantity} uds`,
      date: purchase.purchase_date,
      total_amount: purchase.total_value
    }))
  },

  async getMeetingTransfers(_meetingId: string): Promise<any[]> {
    await delay()
    return []
  },

  async getMeetingExchanges(_meetingId: string): Promise<any[]> {
    await delay()
    return []
  },

  async getMeetingStockLoanPayments(_meetingId: string): Promise<any[]> {
    await delay()
    return []
  },

  async getRevaluationPreview(_meetingId: string): Promise<any> {
    await delay()
    return {
      total_contributions: 10000,
      total_interest: 5000,
      total_to_distribute: 15000,
      details: [
        {
          stock_id: '1',
          type: 'Acción A',
          is_guaranteed: true,
          total_shares: 10,
          previous_value: 100,
          growth_from_contributions: 5,
          growth_from_interest: 3,
          total_growth_per_share: 8,
          estimated_growth_from_contributions: 2,
          new_value: 108
        }
      ],
      total_mandatory_contributions: 2000,
      status: 'preview'
    }
  },

  async confirmRevaluation(meetingId: string): Promise<any> {
    await delay()
    const preview = await mockApi.getRevaluationPreview(meetingId)
    return {
      ...preview,
      status: 'executed',
      executed_at: new Date().toISOString(),
      operation_id: 'op-revaluation'
    }
  },

  async getDisbursementPlan(_meetingId: string): Promise<any> {
    await delay()
    return {
      plan: [
        {
          member_id: '1',
          type: 'loan',
          amount: 1200000,
          loan_id: '1'
        },
        {
          member_id: '2',
          type: 'dividend',
          amount: 200000
        }
      ],
      available_cash: 2000000,
      total_to_disburse: 1400000
    }
  },

  async executeDisbursementPlan(_meetingId: string, data: any): Promise<any> {
    await delay()
    return {
      operation_ids: ['op-disburse-1', 'op-disburse-2'],
      total_disbursed: data.plan_items.reduce((sum: number, item: any) => sum + item.amount, 0)
    }
  },

  // Loans
  async getLoans(): Promise<Loan[]> {
    await delay()
    return [...mockLoans]
  },

  async getLoanById(id: string): Promise<Loan> {
    await delay()
    const loan = mockLoans.find(l => l.id === id)
    if (!loan) throw new Error('Loan not found')
    return { ...loan }
  },

  async getMemberLoans(memberId: string): Promise<Loan[]> {
    await delay()
    return mockLoans.filter(l => l.member_id === memberId)
  },

  async updateLoanTerms(id: string, data: any): Promise<Loan> {
    await delay()
    const loan = mockLoans.find(l => l.id === id)
    if (!loan) throw new Error('Loan not found')
    Object.assign(loan, data)
    return { ...loan }
  },

  async simulatePaymentPlan(_data: any): Promise<any> {
    await delay()
    return {
      schedule: [
        { month: 1, payment: 100000, principal: 95000, interest: 5000, balance: 1905000 },
        { month: 2, payment: 100000, principal: 95475, interest: 4525, balance: 1809525 }
      ],
      totalInterest: 50000,
      totalPayments: 2000000
    }
  },

  async simulateLoanScenarios(_id: string, _data: any): Promise<any> {
    await delay()
    return {
      base_scenario: {
        items: [{ month: 1, payment: 100000, principal: 95000, interest: 5000, balance: 1905000 }],
        total_interest: 50000,
        total_payment: 2000000
      },
      scenarios: []
    }
  },

  // Stocks
  async getStocks(): Promise<Stock[]> {
    await delay()
    return [...mockStocks]
  },

  async getStockById(id: string): Promise<Stock> {
    await delay()
    const stock = mockStocks.find(s => s.id === id)
    if (!stock) throw new Error('Stock not found')
    return { ...stock }
  },

  async updateStock(id: string, data: any): Promise<Stock> {
    await delay()
    const stock = mockStocks.find(s => s.id === id)
    if (!stock) throw new Error('Stock not found')
    Object.assign(stock, data)
    return { ...stock }
  },

  // Contributions
  async getContributions(): Promise<MandatoryContribution[]> {
    await delay()
    return [...mockContributions]
  },

  async createContribution(data: any): Promise<MandatoryContribution> {
    await delay()
    const newContribution: MandatoryContribution = {
      id: String(mockContributions.length + 1),
      ...data
    }
    mockContributions.push(newContribution)
    return newContribution
  },

  async updateContribution(id: string, data: any): Promise<MandatoryContribution> {
    await delay()
    const contribution = mockContributions.find(c => c.id === id)
    if (!contribution) throw new Error('Contribution not found')
    Object.assign(contribution, data)
    return { ...contribution }
  },

  async deleteContribution(id: string): Promise<void> {
    await delay()
    const index = mockContributions.findIndex(c => c.id === id)
    if (index === -1) throw new Error('Contribution not found')
    mockContributions.splice(index, 1)
  },

  async getContributionById(id: string): Promise<MandatoryContribution> {
    await delay()
    const contribution = mockContributions.find(c => c.id === id)
    if (!contribution) throw new Error('Contribution not found')
    return { ...contribution }
  },

  // Ledger
  async getLedgerEntries(query?: any): Promise<PaginatedResponse<LedgerEntry>> {
    await delay()
    const page = query?.page || 1
    const limit = query?.limit || 20
    const start = (page - 1) * limit
    
    let filtered = [...mockLedgerEntries]
    
    // Aplicar filtros
    if (query?.memberId) {
      filtered = filtered.filter(e => e.member_id === query.memberId)
    }
    if (query?.accountType) {
      filtered = filtered.filter(e => e.account_type === query.accountType)
    }
    if (query?.startDate) {
      const startDate = new Date(query.startDate)
      filtered = filtered.filter(e => new Date(e.created_at) >= startDate)
    }
    if (query?.endDate) {
      const endDate = new Date(query.endDate)
      filtered = filtered.filter(e => new Date(e.created_at) <= endDate)
    }
    
    // Ordenar
    if (query?.orderBy === 'ASC') {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } else {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    
    const end = start + limit
    const paginated = filtered.slice(start, end)
    
    return {
      data: paginated,
      page,
      limit,
      total: filtered.length
    }
  },

  async getLedgerEntryById(id: string): Promise<LedgerEntry> {
    await delay()
    const entry = mockLedgerEntries.find(e => e.id === id)
    if (!entry) throw new Error('Ledger entry not found')
    return { ...entry }
  },

  async getLedgerEntriesByOperation(operationId: string): Promise<LedgerEntry[]> {
    await delay()
    return mockLedgerEntries.filter(e => e.operation_id === operationId)
  },

  async getAccountTypes(): Promise<AccountTypeOption[]> {
    await delay()
    return [
      { value: 'CASH', label: 'Cash' },
      { value: 'LOANS_RECEIVABLE', label: 'Loans Receivable' },
      { value: 'LOAN_PORTFOLIO', label: 'Loan Portfolio' },
      { value: 'INTEREST_INCOME', label: 'Interest Income' },
      { value: 'STOCK_PORTFOLIO', label: 'Stock Portfolio' },
      { value: 'MANDATORY_CONTRIBUTIONS', label: 'Mandatory Contributions' },
      { value: 'ACCUMULATED_SURPLUS', label: 'Accumulated Surplus' },
      { value: 'NOVELTY_LOSS', label: 'Novelty Loss' }
    ]
  },

  // Dashboard
  async getDashboardMetrics(): Promise<any> {
    await delay()
    return {
      active_members: {
        count: 42,
        total: 45,
        change_percent: 5
      },
      total_stocks: {
        count: 328,
        value: 16400000,
        change_percent: 8
      },
      active_loans: {
        count: 18,
        in_portfolio: true
      },
      total_portfolio: {
        value: 24500000
      },
      overdue_portfolio: {
        value: 1250000,
        percent_of_total: 5.1
      },
      monthly_collected: {
        value: 8750000,
        change_percent: 12
      }
    }
  },

  async getMonthlyMovements(): Promise<any> {
    await delay()
    return {
      labels: ['Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      collected: [6000000, 6500000, 7000000, 7500000, 8000000, 8750000],
      disbursed: [4500000, 5000000, 5500000, 6000000, 6500000, 7000000]
    }
  },

  async getNextMeeting(): Promise<any> {
    await delay()
    return {
      id: '24',
      number: 24,
      date: '2024-01-15T10:00:00Z',
      participants: 42,
      stock_value: 50000,
      active_loans: 18
    }
  },

  async getRecentActivity(): Promise<any[]> {
    await delay()
    return [
      {
        id: '1',
        type: 'MANDATORY_CONTRIBUTION',
        description: 'Aporte mensual de María González',
        amount: 150000,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
        member_name: 'María González'
      },
      {
        id: '2',
        type: 'LOAN_DISBURSEMENT',
        description: 'Desembolso préstamo Carlos Ramírez',
        amount: -3000000,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 horas atrás
        member_name: 'Carlos Ramírez'
      },
      {
        id: '3',
        type: 'LOAN_PAYMENT',
        description: 'Pago cuota #3 Ana Martínez',
        amount: 520000,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Ayer
        member_name: 'Ana Martínez'
      },
      {
        id: '4',
        type: 'MEMBER_REGISTRATION',
        description: 'Nuevo socio registrado',
        amount: 0,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Hace 2 días
        member_name: 'Nuevo Socio'
      }
    ]
  },

  async getPortfolioStatus(): Promise<any> {
    await delay()
    return {
      up_to_date: 85,
      overdue: 10,
      written_off: 5
    }
  },

  // Operations
  async getOperations(query?: GetOperationsQuery): Promise<PaginatedResponse<Operation>> {
    await delay()
    const page = query?.page || 1
    const limit = query?.limit || 10
    const start = (page - 1) * limit
    
    const mockOperations: Operation[] = [
      {
        id: 'op1',
        member_id: '1',
        meeting_id: '1',
        type: 'MONTHLY_PAYMENT',
        date: '2024-12-15T10:30:00Z',
        description: 'Aporte mensual socios'
      },
      {
        id: 'op2',
        member_id: '2',
        meeting_id: '1',
        type: 'LOAN_DISBURSEMENT',
        date: '2024-12-15T11:00:00Z',
        description: 'Desembolso préstamo María García'
      },
      {
        id: 'op3',
        member_id: '1',
        meeting_id: '1',
        type: 'LOAN_PAYMENT',
        date: '2024-12-15T11:30:00Z',
        description: 'Pago cuota préstamo #38 - Carlos López'
      },
      {
        id: 'op4',
        member_id: null,
        meeting_id: '1',
        type: 'ASSET_REVALUATION',
        date: '2024-12-15T12:00:00Z',
        description: 'Revalorización acciones mes enero'
      }
    ]
    
    let filtered = [...mockOperations]
    
    if (query?.meeting_id) {
      filtered = filtered.filter(op => op.meeting_id === query.meeting_id)
    }
    if (query?.member_id) {
      filtered = filtered.filter(op => op.member_id === query.member_id)
    }
    if (query?.type) {
      filtered = filtered.filter(op => op.type === query.type)
    }
    
    const end = start + limit
    const paginated = filtered.slice(start, end)
    
    return {
      data: paginated,
      page,
      limit,
      total: filtered.length
    }
  },

  async getOperationById(id: string): Promise<Operation> {
    await delay()
    const mockOperations: Operation[] = [
      {
        id: 'op1',
        member_id: '1',
        meeting_id: '1',
        type: 'MONTHLY_PAYMENT',
        date: '2024-12-15T10:30:00Z',
        description: 'Aporte mensual socios',
        entries: []
      },
      {
        id: 'op2',
        member_id: '2',
        meeting_id: '1',
        type: 'LOAN_DISBURSEMENT',
        date: '2024-12-15T11:00:00Z',
        description: 'Desembolso préstamo María García',
        entries: []
      },
      {
        id: 'op3',
        member_id: '1',
        meeting_id: '1',
        type: 'LOAN_PAYMENT',
        date: '2024-12-15T11:30:00Z',
        description: 'Pago cuota préstamo #38 - Carlos López',
        entries: []
      },
      {
        id: 'op4',
        member_id: null,
        meeting_id: '1',
        type: 'ASSET_REVALUATION',
        date: '2024-12-15T12:00:00Z',
        description: 'Revalorización acciones mes enero',
        entries: []
      }
    ]
    
    const operation = mockOperations.find(op => op.id === id)
    if (!operation) {
      throw new Error(`Operation with id ${id} not found`)
    }
    return operation
  },

  // Accounts Summary
  async getAccountsSummary(query?: any): Promise<AccountsSummary> {
    await delay()
    return {
      accounts: [
        {
          account_type: 'CASH',
          account_name: 'Caja General',
          total_balance: 2500000,
          total_debits: 5000000,
          total_credits: 2500000,
          entries_count: 15,
          entries: [],
          has_more_entries: false
        },
        {
          account_type: 'LOANS_RECEIVABLE',
          account_name: 'Cartera de Préstamos',
          total_balance: 24500000,
          total_debits: 30000000,
          total_credits: 5500000,
          entries_count: 42,
          entries: [],
          has_more_entries: false
        },
        {
          account_type: 'STOCK_CAPITAL',
          account_name: 'Capital Social',
          total_balance: 16400000,
          total_debits: 0,
          total_credits: 16400000,
          entries_count: 28,
          entries: [],
          has_more_entries: false
        },
        {
          account_type: 'ACCUMULATED_SURPLUS',
          account_name: 'Utilidades Acumuladas',
          total_balance: 18850000,
          total_debits: 0,
          total_credits: 18850000,
          entries_count: 12,
          entries: [],
          has_more_entries: false
        },
        {
          account_type: 'INTEREST_INCOME',
          account_name: 'Ingresos por Intereses',
          total_balance: 4200000,
          total_debits: 0,
          total_credits: 4200000,
          entries_count: 35,
          entries: [],
          has_more_entries: false
        },
        {
          account_type: 'OTHER_EXPENSES',
          account_name: 'Gastos Administrativos',
          total_balance: 350000,
          total_debits: 350000,
          total_credits: 0,
          entries_count: 8,
          entries: [],
          has_more_entries: false
        },
        {
          account_type: 'NOVELTY_LOSS',
          account_name: 'Provisión Cartera Incobrable',
          total_balance: 200000,
          total_debits: 200000,
          total_credits: 0,
          entries_count: 3,
          entries: [],
          has_more_entries: false
        }
      ],
      summary: {
        total_accounts: 7,
        total_debits: 5350000,
        total_credits: 65050000,
        net_balance: 59700000
      },
      metadata: {
        query_date: new Date(),
        entries_limit: query?.entries_limit || 10
      }
    }
  }
}

