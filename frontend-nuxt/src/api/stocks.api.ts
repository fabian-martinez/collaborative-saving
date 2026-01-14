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
  }
}

