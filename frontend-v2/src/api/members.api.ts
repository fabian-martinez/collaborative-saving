import apiClient from './client'
import { mockApi } from './mocks'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

// Tipos en snake_case según respuestas del backend
export interface Member {
  id: string
  name: string
  email: string
  role: string
  identification_number?: string
  status: string
  address?: string
  phone?: string
  beneficiary?: string
  registration_date: string | Date
  created_at?: string | Date
}

export interface CreateMemberRequest {
  name: string
  email: string
  identification_number?: string
  role?: 'member' | 'admin' | 'treasurer'
  address?: string
  phone?: string
  beneficiary?: string
}

export interface UpdateMemberRequest {
  name?: string
  email?: string
  role?: 'member' | 'admin' | 'treasurer'
  identification_number?: string
  address?: string
  phone?: string
  beneficiary?: string
}

export interface MemberDueDetails {
  interest: number
  principal: number
  outstanding_balance: number
}

export interface MemberDue {
  type: string
  description: string
  amount: number
  reference_id?: string
  details?: MemberDueDetails
  monthly_contribution?: number
  stock_quantity?: number
  novelty_comment?: string
  creation_date?: string
}

export interface MemberPaymentEntry {
  type: string
  amount: number
  description?: string
}

export interface MemberPayment {
  operation_id: string
  type: string
  total_amount: number
  description?: string
  date: string | Date
  meeting_id: string
  entries: MemberPaymentEntry[]
}

export interface MemberPurchase {
  stock_subscription_id: string
  stock_id: string
  stock_name: string
  quantity: number
  unit_value: number
  total_value: number
  purchase_date: string | Date
  meeting_id: string
  operation_id: string
  loan?: {
    loan_id: string
    approved_amount: number
    interest_rate: number
    status: string
  } | null
}

export interface PurchaseStockRequest {
  stock_id: string
  quantity: number
  cash_amount: number
  meeting_id: string
  loan_details?: {
    interest_rate: number
    loan_type: string
  }
}

export interface PurchaseStockResponse {
  operation_id: string
  stock_subscription_id: string
  loan_id?: string
}

export interface RecordMonthlyPaymentsRequest {
  payments: Array<{
    type: string
    amount: number
    description?: string
    reference_id?: string
  }>
  meeting_id?: string
}

export interface RecordMonthlyPaymentsResponse {
  operation_id: string
  total_amount: number
}

export interface StockExchangeRequest {
  from_subscription_id: string
  from_quantity: number
  to_stock_id: string
  to_quantity: number
  difference_handling?: 'cash' | 'credit'
  target_loan_id?: string
  notes?: string
}

export interface StockTransferRequest {
  transfer_subscription_id: string
  transfer_quantity: number
  to_member_id: string
  notes?: string
}

export interface StockLoanPaymentRequest {
  loan_payment_subscription_id: string
  loan_payment_quantity: number
  loan_id: string
  notes?: string
}

export interface StockOperationResponse {
  operation_id: string
  message: string
  details?: unknown
}

export interface StockExchangeResponse {
  operation_id: string
  meeting_id: string
  date: string | Date
  description: string
  from_stock_id: string
  from_stock_name: string
  from_quantity: number
  from_value: number
  to_stock_id: string
  to_stock_name: string
  to_quantity: number
  to_value: number
  difference: number
  difference_handling?: 'cash' | 'credit'
  from_subscription_id: string
  to_subscription_id: string
  pending_payment_id?: string | null
  loan_id?: string | null
}

export interface StockTransferResponse {
  operation_id: string
  meeting_id: string
  date: string | Date
  description: string
  from_subscription_id: string
  to_subscription_id: string
  stock_id: string
  stock_name: string
  quantity: number
  value: number
  from_member_id: string
  from_member_name: string
  to_member_id: string
  to_member_name: string
}

export interface StockLoanPaymentResponse {
  operation_id: string
  meeting_id: string
  date: string | Date
  description: string
  subscription_id: string
  stock_id: string
  stock_name: string
  quantity: number
  payment_value: number
  loan_id: string
  loan_type: string
  previous_balance: number
  new_balance: number
  transaction_detail_id: string
}

export interface Loan {
  id: string
  member_id: string
  loan_type: string
  approved_amount: number
  disbursed_amount: number
  outstanding_balance: number
  monthly_payment_amount: number
  interest_rate: number
  term: number
  status: string
  creation_date: string | Date
  guaranteed_stock_id?: string | null
}

export interface PaymentScheduleItem {
  date: string | Date
  type: 'historical' | 'projected'
  loan_id?: string
  loan_type?: string
  total_amount: number
  interest_amount: number
  principal_amount: number
  status: 'paid' | 'pending' | 'overdue'
  operation_id?: string
  remaining_balance?: number
  payment_number?: number
}

export interface PaymentScheduleSummary {
  total_paid: number
  total_pending: number
  next_payment_date?: string | Date
  next_payment_amount: number
  total_outstanding_balance: number
}

export interface PaymentSchedule {
  member_id: string
  historical_payments: PaymentScheduleItem[]
  projected_payments: PaymentScheduleItem[]
  summary: PaymentScheduleSummary
}

export interface GetMemberPaymentsQuery {
  meeting_id?: string
  type?: string
}

export interface GetMemberPurchasesQuery {
  meeting_id?: string
}

export interface GetMemberStockModificationsQuery {
  meeting_id?: string
  type?: string
}

export interface GetPaymentScheduleQuery {
  months?: number
}

export interface StockSubscription {
  id: string
  stock_id: string
  stock_name: string
  quantity: number
  purchase_date: string | Date
  status: string
  financing_loan_id?: string | null
}

// API Functions
export const membersApi = {
  // Basic CRUD
  async getMembers(): Promise<Member[]> {
    if (USE_MOCKS) {
      return mockApi.getMembers()
    }
    const response = await apiClient.get<Member[]>('/v2/members')
    return response.data
  },

  async getMemberById(id: string): Promise<Member> {
    if (USE_MOCKS) {
      return mockApi.getMemberById(id)
    }
    const response = await apiClient.get<Member>(`/v2/members/${id}`)
    return response.data
  },

  async createMember(data: CreateMemberRequest): Promise<Member> {
    if (USE_MOCKS) {
      return mockApi.createMember(data)
    }
    const response = await apiClient.post<Member>('/v2/members', data)
    return response.data
  },

  async updateMember(id: string, data: UpdateMemberRequest): Promise<Member> {
    if (USE_MOCKS) {
      return mockApi.updateMember(id, data)
    }
    const response = await apiClient.patch<Member>(`/v2/members/${id}`, data)
    return response.data
  },

  async deleteMember(id: string): Promise<void> {
    if (USE_MOCKS) {
      return mockApi.deleteMember(id)
    }
    await apiClient.delete(`/v2/members/${id}`)
  },

  // Member Dues
  async getMemberDues(memberId: string): Promise<MemberDue[]> {
    if (USE_MOCKS) {
      return mockApi.getMemberDues(memberId)
    }
    const response = await apiClient.get<MemberDue[]>(`/v2/members/${memberId}/dues`)
    return response.data
  },

  // Insurance
  async getMemberInsurance(
    memberId: string,
    capitalPayment?: number
  ): Promise<{ insurance_amount: number }> {
    if (USE_MOCKS) {
      return mockApi.getMemberInsurance(memberId)
    }
    const params = capitalPayment !== undefined ? `?capitalPayment=${capitalPayment}` : ''
    const response = await apiClient.get<{ insurance_amount: number }>(
      `/v2/members/${memberId}/insurance${params}`
    )
    return response.data
  },

  // Payments
  async recordMonthlyPayment(
    memberId: string,
    data: RecordMonthlyPaymentsRequest
  ): Promise<RecordMonthlyPaymentsResponse> {
    if (USE_MOCKS) {
      return mockApi.recordMonthlyPayment(memberId, data)
    }
    const response = await apiClient.post<RecordMonthlyPaymentsResponse>(
      `/v2/members/${memberId}/payments`,
      data
    )
    return response.data
  },

  async getMemberPayments(
    memberId: string,
    query?: GetMemberPaymentsQuery
  ): Promise<MemberPayment[]> {
    if (USE_MOCKS) {
      return mockApi.getMemberPayments(memberId)
    }
    const params = new URLSearchParams()
    if (query?.meeting_id) params.append('meeting_id', query.meeting_id)
    if (query?.type) params.append('type', query.type)
    const queryString = params.toString()
    const url = `/v2/members/${memberId}/payments${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<MemberPayment[]>(url)
    return response.data
  },

  // Purchases
  async getMemberPurchases(
    memberId: string,
    query?: GetMemberPurchasesQuery
  ): Promise<MemberPurchase[]> {
    if (USE_MOCKS) {
      return mockApi.getMemberPurchases(memberId)
    }
    const params = new URLSearchParams()
    if (query?.meeting_id) params.append('meeting_id', query.meeting_id)
    const queryString = params.toString()
    const url = `/v2/members/${memberId}/purchase${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<MemberPurchase[]>(url)
    return response.data
  },

  async createStockPurchase(
    memberId: string,
    data: PurchaseStockRequest
  ): Promise<PurchaseStockResponse> {
    if (USE_MOCKS) {
      return mockApi.createStockPurchase(memberId, data)
    }
    const response = await apiClient.post<PurchaseStockResponse>(
      `/v2/members/${memberId}/purchase`,
      data
    )
    return response.data
  },

  // Loans
  async getMemberLoans(memberId: string): Promise<Loan[]> {
    if (USE_MOCKS) {
      return mockApi.getMemberLoans ? mockApi.getMemberLoans(memberId) : []
    }
    const response = await apiClient.get<Loan[]>(`/v2/members/${memberId}/loans`)
    return response.data
  },

  // Stock Operations
  async getMemberExchanges(
    memberId: string,
    query?: GetMemberStockModificationsQuery
  ): Promise<StockExchangeResponse[]> {
    if (USE_MOCKS) {
      const result = await mockApi.getMemberExchanges(memberId)
      return result as unknown as StockExchangeResponse[]
    }
    const params = new URLSearchParams()
    if (query?.meeting_id) params.append('meeting_id', query.meeting_id)
    if (query?.type) params.append('type', query.type)
    const queryString = params.toString()
    const url = `/v2/members/${memberId}/exchange${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<StockExchangeResponse[]>(url)
    return response.data
  },

  async getMemberStockSubscriptions(
    memberId: string,
    includeInactive?: boolean
  ): Promise<StockSubscription[]> {
    if (USE_MOCKS) {
      return mockApi.getMemberStockSubscriptions(memberId)
    }
    const params = new URLSearchParams()
    if (includeInactive === true) {
      params.append('includeInactive', 'true')
    }
    const queryString = params.toString()
    const url = `/v2/members/${memberId}/stock-subscriptions${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<StockSubscription[]>(url)
    return response.data
  },

  async getStockSubscriptionById(
    memberId: string,
    subscriptionId: string
  ): Promise<StockSubscription> {
    if (USE_MOCKS) {
      // For mocks, try to find in existing subscriptions or return a mock
      const subscriptions = await mockApi.getMemberStockSubscriptions(memberId)
      const found = subscriptions.find(sub => sub.id === subscriptionId)
      if (found) return found
      // Return a mock subscription if not found
      return {
        id: subscriptionId,
        stock_id: 'mock-stock-id',
        stock_name: 'Acción A',
        quantity: 0,
        purchase_date: new Date(),
        status: 'inactive',
        financing_loan_id: null
      }
    }
    const response = await apiClient.get<StockSubscription>(
      `/v2/members/${memberId}/stock-subscriptions/${subscriptionId}`
    )
    return response.data
  },

  async getMemberTransfers(
    memberId: string,
    query?: GetMemberStockModificationsQuery
  ): Promise<StockTransferResponse[]> {
    if (USE_MOCKS) {
      const result = await mockApi.getMemberTransfers(memberId)
      return result as unknown as StockTransferResponse[]
    }
    const params = new URLSearchParams()
    if (query?.meeting_id) params.append('meeting_id', query.meeting_id)
    if (query?.type) params.append('type', query.type)
    const queryString = params.toString()
    const url = `/v2/members/${memberId}/transfer${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<StockTransferResponse[]>(url)
    return response.data
  },

  async getMemberStockLoanPayments(
    memberId: string,
    query?: GetMemberStockModificationsQuery
  ): Promise<StockLoanPaymentResponse[]> {
    if (USE_MOCKS) {
      const result = await mockApi.getMemberStockLoanPayments(memberId)
      return result as unknown as StockLoanPaymentResponse[]
    }
    const params = new URLSearchParams()
    if (query?.meeting_id) params.append('meeting_id', query.meeting_id)
    if (query?.type) params.append('type', query.type)
    const queryString = params.toString()
    const url = `/v2/members/${memberId}/stock-loan-payment${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<StockLoanPaymentResponse[]>(url)
    return response.data
  },

  async processStockExchange(
    memberId: string,
    data: StockExchangeRequest
  ): Promise<StockOperationResponse> {
    if (USE_MOCKS) {
      return mockApi.processStockExchange(memberId, data)
    }
    const response = await apiClient.post<StockOperationResponse>(
      `/v2/members/${memberId}/exchange`,
      data
    )
    return response.data
  },

  async processStockTransfer(
    memberId: string,
    data: StockTransferRequest
  ): Promise<StockOperationResponse> {
    if (USE_MOCKS) {
      return mockApi.processStockTransfer(memberId, data)
    }
    const response = await apiClient.post<StockOperationResponse>(
      `/v2/members/${memberId}/transfer`,
      data
    )
    return response.data
  },

  async processStockLoanPayment(
    memberId: string,
    data: StockLoanPaymentRequest
  ): Promise<StockOperationResponse> {
    if (USE_MOCKS) {
      return mockApi.processStockLoanPayment(memberId, data)
    }
    const response = await apiClient.post<StockOperationResponse>(
      `/v2/members/${memberId}/stock-loan-payment`,
      data
    )
    return response.data
  },

  // Payment Schedule
  async getMemberPaymentSchedule(
    memberId: string,
    query?: GetPaymentScheduleQuery
  ): Promise<PaymentSchedule> {
    if (USE_MOCKS) {
      return mockApi.getMemberPaymentSchedule(memberId)
    }
    const params = new URLSearchParams()
    if (query?.months !== undefined) params.append('months', String(query.months))
    const queryString = params.toString()
    const url = `/v2/members/${memberId}/payment-schedule${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<PaymentSchedule>(url)
    return response.data
  }
}

