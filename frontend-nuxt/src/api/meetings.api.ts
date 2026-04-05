import apiClient from './client'
import { mockApi } from './mocks'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

// Tipos en snake_case según respuestas del backend
export interface Meeting {
  id: string
  date: string | Date
  status: 'active' | 'closed'
  notes: string | null
  created_at: string | Date
  summary?: MeetingSummary
}

export interface MeetingSummary {
  total_cash?: number
  total_interest?: number
  total_loans?: number
  total_collected?: number
  total_dividends?: number
  total_stock_investment?: number
  final_cash_balance?: number
  total_disbursed?: number
  participants_count?: number
  duration?: string
}

export interface CreateMeetingRequest {
  date: string | Date
  notes?: string
}

export interface CloseMeetingRequest {
  authorized_by?: string
}

export interface RevaluationDetail {
  stock_id: string
  type: string
  is_guaranteed: boolean
  total_shares: number
  previous_value: number
  growth_from_contributions: number
  growth_from_interest: number
  total_growth_per_share: number
  estimated_growth_from_contributions: number
  new_value: number
  dividends_generated?: number
}

export interface MandatoryContributionByType {
  mandatory_contribution_id: string
  total: number
}

export interface RevaluationResponse {
  total_contributions: number
  total_interest: number
  total_to_distribute: number
  details: RevaluationDetail[]
  total_mandatory_contributions: number
  mandatory_contributions_by_type?: MandatoryContributionByType[]
  status: 'preview' | 'executed'
  executed_at?: string
  operation_id?: string
}

export interface DisbursementStockRequest {
  stock_id: string
  stock_withdrawal_quantity?: number
}

export interface NewLoanRequest {
  member_id: string
  amount: number
  loan_type: 'corriente' | 'agil' | 'accion' | 'prioritario'
  approved_amount: number
  monthly_payment_amount: number
  interest_rate: number
  notes?: string
}

export interface DisbursementPlanItem {
  member_id: string
  type: string
  amount: number
  status?: string
  notes?: string
  pending_member_payment_id?: string
  loan_id?: string
  stock_subscription_id?: string
  disbursement_stock_request?: DisbursementStockRequest
  new_loan_request?: NewLoanRequest
}

export interface DisbursementPlanPreview {
  plan: DisbursementPlanItem[]
  available_cash: number
  total_to_disburse: number
}

export interface ExecuteDisbursementPlanRequest {
  plan: DisbursementPlanItem[]
}

export interface ExecuteDisbursementPlanResponse {
  operation_ids: string[]
  total_disbursed: number
}

export interface Operation {
  id: string
  member_id?: string
  meeting_id: string
  type: string
  description?: string
  date: string | Date
  total_amount: number
}

export interface GetMeetingQuery {
  include_summary?: boolean
}

// API Functions
export const meetingsApi = {
  // Basic CRUD
  async getMeetings(): Promise<Meeting[]> {
    if (USE_MOCKS) {
      return mockApi.getMeetings()
    }
    const response = await apiClient.get<Meeting[]>('/v2/meetings')
    return response.data
  },

  async getMeetingById(id: string, query?: GetMeetingQuery): Promise<Meeting> {
    if (USE_MOCKS) {
      return mockApi.getMeetingById(id)
    }
    const params = new URLSearchParams()
    if (query?.include_summary) params.append('include_summary', 'true')
    const queryString = params.toString()
    const url = `/v2/meetings/${id}${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<Meeting>(url)
    return response.data
  },

  async getActiveMeeting(): Promise<Meeting> {
    if (USE_MOCKS) {
      return mockApi.getActiveMeeting()
    }
    const response = await apiClient.get<Meeting>('/v2/meetings/active')
    return response.data
  },

  async createMeeting(data: CreateMeetingRequest): Promise<Meeting> {
    if (USE_MOCKS) {
      return mockApi.createMeeting(data)
    }
    const response = await apiClient.post<Meeting>('/v2/meetings', data)
    return response.data
  },

  async closeMeeting(id: string, data?: CloseMeetingRequest): Promise<Meeting> {
    if (USE_MOCKS) {
      return mockApi.closeMeeting(id)
    }
    const response = await apiClient.patch<Meeting>(`/v2/meetings/${id}/close`, data || {})
    return response.data
  },

  // Meeting Payments
  async getMeetingPayments(meetingId: string): Promise<Operation[]> {
    if (USE_MOCKS) {
      return (await mockApi.getMeetingPayments(meetingId)) as Operation[]
    }
    const response = await apiClient.get<Operation[]>(`/v2/meetings/${meetingId}/payments`)
    return response.data
  },

  // Meeting Purchases
  async getMeetingPurchases(meetingId: string): Promise<Operation[]> {
    if (USE_MOCKS) {
      return mockApi.getMeetingPurchases(meetingId)
    }
    const response = await apiClient.get<Operation[]>(`/v2/meetings/${meetingId}/purchases`)
    return response.data
  },

  // Meeting Stock Operations
  async getMeetingTransfers(meetingId: string): Promise<Operation[]> {
    if (USE_MOCKS) {
      return mockApi.getMeetingTransfers(meetingId)
    }
    const response = await apiClient.get<Operation[]>(`/v2/meetings/${meetingId}/transfers`)
    return response.data
  },

  async getMeetingExchanges(meetingId: string): Promise<Operation[]> {
    if (USE_MOCKS) {
      return mockApi.getMeetingExchanges(meetingId)
    }
    const response = await apiClient.get<Operation[]>(`/v2/meetings/${meetingId}/exchanges`)
    return response.data
  },

  async getMeetingStockLoanPayments(meetingId: string): Promise<Operation[]> {
    if (USE_MOCKS) {
      return mockApi.getMeetingStockLoanPayments(meetingId)
    }
    const response = await apiClient.get<Operation[]>(`/v2/meetings/${meetingId}/stock-loan-payments`)
    return response.data
  },

  // Revaluation
  async getRevaluationPreview(meetingId: string): Promise<RevaluationResponse> {
    if (USE_MOCKS) {
      return mockApi.getRevaluationPreview(meetingId)
    }
    const response = await apiClient.get<RevaluationResponse>(`/v2/meetings/${meetingId}/revaluation`)
    return response.data
  },

  async confirmRevaluation(meetingId: string): Promise<RevaluationResponse> {
    if (USE_MOCKS) {
      return mockApi.confirmRevaluation(meetingId)
    }
    const response = await apiClient.patch<RevaluationResponse>(
      `/v2/meetings/${meetingId}/revaluation/confirm`,
      {}
    )
    return response.data
  },

  // Disbursement Plan
  async getDisbursementPlan(meetingId: string): Promise<DisbursementPlanPreview> {
    if (USE_MOCKS) {
      return mockApi.getDisbursementPlan(meetingId)
    }
    const response = await apiClient.get<DisbursementPlanPreview>(
      `/v2/meetings/${meetingId}/disbursement-plan`
    )
    return response.data
  },

  async executeDisbursementPlan(
    meetingId: string,
    data: ExecuteDisbursementPlanRequest
  ): Promise<ExecuteDisbursementPlanResponse> {
    if (USE_MOCKS) {
      return mockApi.executeDisbursementPlan(meetingId, data)
    }
    const response = await apiClient.post<ExecuteDisbursementPlanResponse>(
      `/v2/meetings/${meetingId}/disbursement-plan`,
      data
    )
    return response.data
  }
}
