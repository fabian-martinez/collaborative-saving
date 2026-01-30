import apiClient from './client'

export interface LoanType {
  id: string
  name: string
  default_approved_amount: number
  default_interest_rate: number
  default_term: number
  amortization_type: 'french' | 'german'
}

export interface StockType {
  id: string
  name: string
  behavior: 'CAPITAL_APPRECIATION' | 'DIVIDEND_YIELD'
}

export interface InterestDistributionConfig {
  id: string
  loan_type_id: string
  stock_type_id: string
}

export const settingsApi = {
  // Loan Types
  async getLoanTypes(): Promise<LoanType[]> {
    const response = await apiClient.get<LoanType[]>('/v2/settings/loan-types')
    return response.data
  },
  async createLoanType(data: Omit<LoanType, 'id'>): Promise<LoanType> {
    const response = await apiClient.post<LoanType>('/v2/settings/loan-types', data)
    return response.data
  },
  async updateLoanType(id: string, data: Partial<Omit<LoanType, 'id'>>): Promise<LoanType> {
    const response = await apiClient.patch<LoanType>(`/v2/settings/loan-types/${id}`, data)
    return response.data
  },
  async deleteLoanType(id: string): Promise<void> {
    await apiClient.delete(`/v2/settings/loan-types/${id}`)
  },

  // Stock Types
  async getStockTypes(): Promise<StockType[]> {
    const response = await apiClient.get<StockType[]>('/v2/settings/stock-types')
    return response.data
  },
  async createStockType(data: Omit<StockType, 'id'>): Promise<StockType> {
    const response = await apiClient.post<StockType>('/v2/settings/stock-types', data)
    return response.data
  },
  async updateStockType(id: string, data: Partial<Omit<StockType, 'id'>>): Promise<StockType> {
    const response = await apiClient.patch<StockType>(`/v2/settings/stock-types/${id}`, data)
    return response.data
  },
  async deleteStockType(id: string): Promise<void> {
    await apiClient.delete(`/v2/settings/stock-types/${id}`)
  },

  // Interest Distribution Configs
  async getDistributionConfigs(): Promise<InterestDistributionConfig[]> {
    const response = await apiClient.get<InterestDistributionConfig[]>('/v2/settings/distribution-configs')
    return response.data
  },

  async createDistributionConfig(data: { loan_type_id: string; stock_type_id: string }): Promise<InterestDistributionConfig> {
    const response = await apiClient.post<InterestDistributionConfig>('/v2/settings/distribution-configs', data)
    return response.data
  },

  async updateDistributionConfig(id: string, data: { loan_type_id?: string; stock_type_id?: string }): Promise<InterestDistributionConfig> {
    const response = await apiClient.patch<InterestDistributionConfig>(`/v2/settings/distribution-configs/${id}`, data)
    return response.data
  },

  async deleteDistributionConfig(id: string): Promise<void> {
    await apiClient.delete(`/v2/settings/distribution-configs/${id}`)
  }
}
