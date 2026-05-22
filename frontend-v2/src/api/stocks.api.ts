import apiClient from './client'
import { mockApi } from './mocks'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

// Tipos en snake_case según respuestas del backend
export interface Stock {
  id: string
  type: string
  value: number
  monthly_contribution: number
  is_guaranteed: boolean
  guaranteed_yield?: number | null
  behavior: string
  created_at: string | Date
}

export interface UpdateStockRequest {
  value?: number
  monthly_contribution?: number
  is_guaranteed?: boolean
  guaranteed_yield?: number | null
  behavior?: string
}

export interface CreateCdtRequest {
  member_id: string
  amount: number
  term_months: number
}

// API Functions
export const stocksApi = {
  async getStocks(): Promise<Stock[]> {
    if (USE_MOCKS) {
      return mockApi.getStocks()
    }
    const response = await apiClient.get<Stock[]>('/v2/stocks')
    return response.data
  },

  async getStockById(id: string): Promise<Stock> {
    if (USE_MOCKS) {
      return mockApi.getStockById(id)
    }
    const response = await apiClient.get<Stock>(`/v2/stocks/${id}`)
    return response.data
  },

  async updateStock(id: string, data: UpdateStockRequest): Promise<Stock> {
    if (USE_MOCKS) {
      return mockApi.updateStock(id, data)
    }
    const response = await apiClient.patch<Stock>(`/v2/stocks/${id}`, data)
    return response.data
  },

  async createCdt(data: CreateCdtRequest): Promise<void> {
    if (USE_MOCKS) {
      // Mock logic for creating CDT if needed
      return Promise.resolve()
    }
    await apiClient.post<void>('/v2/stocks/cdts', data)
  }
}

