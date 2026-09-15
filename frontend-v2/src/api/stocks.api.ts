import apiClient from './client'
import { mockApi } from './mocks'
import type { StockType } from './settings.api'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

// Tipos en snake_case según respuestas del backend
export interface Stock {
  id: string
  name: string
  type: string
  stock_type_id?: string | null
  stock_type?: StockType | null
  value: number
  monthly_contribution: number
  is_guaranteed: boolean
  guaranteed_yield?: number | null
  behavior: string
  created_at: string | Date
}

export interface CreateStockRequest {
  name: string
  stock_type_id?: string | null
  value: number
  monthly_contribution: number
  is_guaranteed?: boolean
  guaranteed_yield?: number | null
  behavior?: string
}

export interface UpdateStockRequest {
  name?: string
  stock_type_id?: string | null
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

  async createStock(data: CreateStockRequest): Promise<Stock> {
    if (USE_MOCKS) {
      return mockApi.createStock(data)
    }
    const response = await apiClient.post<Stock>('/v2/stocks', data)
    return response.data
  },

  async updateStock(id: string, data: UpdateStockRequest): Promise<Stock> {
    if (USE_MOCKS) {
      return mockApi.updateStock(id, data)
    }
    const response = await apiClient.patch<Stock>(`/v2/stocks/${id}`, data)
    return response.data
  },

  async deleteStock(id: string): Promise<void> {
    if (USE_MOCKS) {
      return mockApi.deleteStock(id)
    }
    await apiClient.delete<void>(`/v2/stocks/${id}`)
  },

  async createCdt(data: CreateCdtRequest): Promise<void> {
    if (USE_MOCKS) {
      // Mock logic for creating CDT if needed
      return Promise.resolve()
    }
    await apiClient.post<void>('/v2/stocks/cdts', data)
  }
}

