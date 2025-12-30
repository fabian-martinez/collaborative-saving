import apiClient from './client'
import { mockApi } from './mocks'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

// Tipos en snake_case según respuestas del backend
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

export interface UpdateLoanTermsRequest {
  interest_rate?: number
  monthly_payment_amount?: number
  term?: number
}

export interface PaymentPlanRequest {
  principal: number
  rate: number
  term: number
  amortization_type: 'french' | 'german'
}

export interface PaymentPlanItem {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

export interface PaymentPlanResponse {
  items: PaymentPlanItem[]
  total_interest: number
  total_payment: number
}

export interface LoanScenario {
  name: string
  extra_payment: number
  start_month: number
  amortization_type: 'french' | 'german'
}

export interface SimulateLoanScenariosRequest {
  scenarios: LoanScenario[]
}

export interface LoanScenarioResult {
  scenario_name: string
  items: PaymentPlanItem[]
  total_interest: number
  total_payment: number
  savings_vs_base?: number
}

export interface SimulateLoanScenariosResponse {
  base_scenario: {
    items: PaymentPlanItem[]
    total_interest: number
    total_payment: number
  }
  scenarios: LoanScenarioResult[]
}

// API Functions
export const loansApi = {
  async getLoans(): Promise<Loan[]> {
    if (USE_MOCKS) {
      return mockApi.getLoans()
    }
    const response = await apiClient.get<Loan[]>('/v2/loans')
    return response.data
  },

  async getLoanById(id: string): Promise<Loan> {
    if (USE_MOCKS) {
      return mockApi.getLoanById(id)
    }
    const response = await apiClient.get<Loan>(`/v2/loans/${id}`)
    return response.data
  },

  async getMemberLoans(memberId: string): Promise<Loan[]> {
    if (USE_MOCKS) {
      return mockApi.getMemberLoans(memberId)
    }
    const response = await apiClient.get<Loan[]>(`/v2/loans/member/${memberId}`)
    return response.data
  },

  async updateLoanTerms(id: string, data: UpdateLoanTermsRequest): Promise<Loan> {
    if (USE_MOCKS) {
      return mockApi.updateLoanTerms(id, data)
    }
    const response = await apiClient.patch<Loan>(`/v2/loans/${id}/terms`, data)
    return response.data
  },

  async simulatePaymentPlan(data: PaymentPlanRequest): Promise<PaymentPlanResponse> {
    if (USE_MOCKS) {
      return mockApi.simulatePaymentPlan(data)
    }
    const response = await apiClient.post<PaymentPlanResponse>('/v2/loans/simulate-plan', data)
    return response.data
  },

  async simulateLoanScenarios(
    id: string,
    data: SimulateLoanScenariosRequest
  ): Promise<SimulateLoanScenariosResponse> {
    if (USE_MOCKS) {
      return mockApi.simulateLoanScenarios(id, data)
    }
    const response = await apiClient.post<SimulateLoanScenariosResponse>(
      `/v2/loans/${id}/simulate-scenarios`,
      data
    )
    return response.data
  }
}

