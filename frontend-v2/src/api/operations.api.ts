import apiClient from './client'
import type { PaginatedResponse } from './types'
import { mockApi } from './mocks'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export interface LedgerEntry {
  id: string
  operation_id: string
  account_type: string
  amount: number
  created_at: string | Date
  description: string | null
  loan_id: string | null
  stock_id: string | null
  mandatory_contribution_id: string | null
  stock_subscription_id: string | null
}

export interface Operation {
  id: string
  member_id: string | null
  meeting_id: string
  type: string
  date: string | Date
  description: string | null
  entries?: LedgerEntry[]
}

export interface GetOperationsQuery {
  member_id?: string
  meeting_id?: string
  start_date?: string
  end_date?: string
  type?: string
  page?: number
  limit?: number
  order_by?: 'ASC' | 'DESC'
}

export const operationsApi = {
  async getOperations(query?: GetOperationsQuery): Promise<PaginatedResponse<Operation>> {
    if (USE_MOCKS) {
      return mockApi.getOperations(query)
    }
    const params = new URLSearchParams()
    if (query?.member_id) params.append('member_id', query.member_id)
    if (query?.meeting_id) params.append('meeting_id', query.meeting_id)
    if (query?.start_date) params.append('start_date', query.start_date)
    if (query?.end_date) params.append('end_date', query.end_date)
    if (query?.type) params.append('type', query.type)
    if (query?.page) params.append('page', query.page.toString())
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.order_by) params.append('order_by', query.order_by)
    
    const queryString = params.toString()
    const url = `/v2/accounting/operations${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<{ data: Operation[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(url)
    
    // Map backend response structure to frontend expected structure
    return {
      data: response.data.data,
      page: response.data.pagination.page,
      limit: response.data.pagination.limit,
      total: response.data.pagination.total
    }
  }
}

