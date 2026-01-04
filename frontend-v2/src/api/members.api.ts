import apiClient from './client'
import type { PaginatedResponse } from './types'
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
  stock_type: string
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

export interface PaymentScheduleItem {
  due_date: string | Date
  type: string
  amount: number
  description?: string
}

export interface PaymentSchedule {
  items: PaymentScheduleItem[]
  total_amount: number
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
  start_date?: string
  end_date?: string
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
    if (query?.meeting_id) params.append('meetingId', query.meeting_id)
    const queryString = params.toString()
    const url = `/v2/members/${memberId}/purchases${queryString ? `?${queryString}` : ''}`
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

  // Stock Operations
  async getMemberExchanges(
    memberId: string,
    query?: GetMemberStockModificationsQuery
  ): Promise<StockOperationResponse[]> {
    if (USE_MOCKS) {
      return mockApi.getMemberExchanges(memberId)
    }
    const params = new URLSearchParams()
    if (query?.meeting_id) params.append('meeting_id', query.meeting_id)
    if (query?.type) params.append('type', query.type)
    const queryString = params.toString()
    const url = `/v2/members/${memberId}/exchanges${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<StockOperationResponse[]>(url)
    return response.data
  },

  async getMemberTransfers(
    memberId: string,
    query?: GetMemberStockModificationsQuery
  ): Promise<StockOperationResponse[]> {
    if (USE_MOCKS) {
      return mockApi.getMemberTransfers(memberId)
    }
    const params = new URLSearchParams()
    if (query?.meeting_id) params.append('meeting_id', query.meeting_id)
    if (query?.type) params.append('type', query.type)
    const queryString = params.toString()
    const url = `/v2/members/${memberId}/transfers${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<StockOperationResponse[]>(url)
    return response.data
  },

  async getMemberStockLoanPayments(
    memberId: string,
    query?: GetMemberStockModificationsQuery
  ): Promise<StockOperationResponse[]> {
    if (USE_MOCKS) {
      return mockApi.getMemberStockLoanPayments(memberId)
    }
    const params = new URLSearchParams()
    if (query?.meeting_id) params.append('meeting_id', query.meeting_id)
    if (query?.type) params.append('type', query.type)
    const queryString = params.toString()
    const url = `/v2/members/${memberId}/stock-loan-payments${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<StockOperationResponse[]>(url)
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
    if (query?.start_date) params.append('startDate', query.start_date)
    if (query?.end_date) params.append('endDate', query.end_date)
    const queryString = params.toString()
    const url = `/v2/members/${memberId}/payment-schedule${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<PaymentSchedule>(url)
    return response.data
  }
}

