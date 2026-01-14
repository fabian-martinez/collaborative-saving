import apiClient from './client'
import type { PaginatedResponse } from './types'
import { mockApi } from './mocks'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

// Tipos en snake_case según respuestas del backend
export interface LedgerEntry {
  id: string
  operation_id: string
  account_type: string
  amount: number
  description?: string | null
  created_at: string | Date
  operation_type?: string
  operation_description?: string
  operation_date?: string | Date
  member_id?: string | null
  member_name?: string | null
  meeting_id?: string | null
  meeting_date?: string | Date | null
  loan_id?: string | null
  stock_id?: string | null
  mandatory_contribution_id?: string | null
  stock_subscription_id?: string | null
}

export interface AccountTypeOption {
  value: string
  label: string
}

export interface GetLedgerEntriesQuery {
  member_id?: string
  account_type?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
  order_by?: 'ASC' | 'DESC'
}

export interface AccountLedgerEntry {
  id: string
  operation_id: string
  account_type: string
  amount: number
  created_at: string | Date
  description?: string | null
  loan_id?: string | null
  stock_id?: string | null
  mandatory_contribution_id?: string | null
  stock_subscription_id?: string | null
  operation_type?: string
  operation_date?: string | Date
}

export interface AccountSummary {
  account_type: string
  account_name?: string
  total_balance: number
  total_debits: number
  total_credits: number
  entries_count: number
  entries: AccountLedgerEntry[]
  has_more_entries: boolean
}

export interface AccountsSummary {
  accounts: AccountSummary[]
  summary: {
    total_accounts: number
    total_debits: number
    total_credits: number
    net_balance: number
  }
  metadata: {
    query_date: Date | string
    date_range?: {
      start_date: string
      end_date: string
    }
    entries_limit: number
  }
}

export interface GetAccountsSummaryQuery {
  entries_limit?: number
  start_date?: string
  end_date?: string
  account_types?: string[]
  include_zero_balance?: boolean
}

// API Functions
export const ledgerApi = {
  async getLedgerEntries(query?: GetLedgerEntriesQuery): Promise<PaginatedResponse<LedgerEntry>> {
    if (USE_MOCKS) {
      return mockApi.getLedgerEntries(query)
    }
    const params = new URLSearchParams()
    if (query?.member_id) params.append('member_id', query.member_id)
    if (query?.account_type) params.append('account_type', query.account_type)
    if (query?.start_date) params.append('start_date', query.start_date)
    if (query?.end_date) params.append('end_date', query.end_date)
    if (query?.page) params.append('page', query.page.toString())
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.order_by) params.append('order_by', query.order_by)
    const queryString = params.toString()
    const url = `/v2/accounting/ledger-entries${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<{ data: LedgerEntry[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(url)
    
    // Map backend response structure to frontend expected structure
    return {
      data: response.data.data,
      page: response.data.pagination.page,
      limit: response.data.pagination.limit,
      total: response.data.pagination.total
    }
  },

  async getLedgerEntryById(id: string): Promise<LedgerEntry> {
    if (USE_MOCKS) {
      return mockApi.getLedgerEntryById(id)
    }
    const response = await apiClient.get<LedgerEntry>(`/ledger-entries/${id}`)
    return response.data
  },

  async getLedgerEntriesByOperation(operationId: string): Promise<LedgerEntry[]> {
    if (USE_MOCKS) {
      return mockApi.getLedgerEntriesByOperation(operationId)
    }
    const response = await apiClient.get<LedgerEntry[]>(
      `/ledger-entries/operation/${operationId}`
    )
    return response.data
  },

  async getAccountTypes(): Promise<AccountTypeOption[]> {
    if (USE_MOCKS) {
      return mockApi.getAccountTypes()
    }
    const response = await apiClient.get<AccountTypeOption[]>('/v2/accounting/ledger-entries/account-types')
    return response.data
  },

  async getAccountsSummary(query?: GetAccountsSummaryQuery): Promise<AccountsSummary> {
    if (USE_MOCKS) {
      return mockApi.getAccountsSummary(query)
    }
    const params = new URLSearchParams()
    if (query?.entries_limit) params.append('entries_limit', query.entries_limit.toString())
    if (query?.start_date) params.append('start_date', query.start_date)
    if (query?.end_date) params.append('end_date', query.end_date)
    if (query?.account_types && query.account_types.length > 0) {
      query.account_types.forEach(type => params.append('account_types', type))
    }
    if (query?.include_zero_balance !== undefined) {
      params.append('include_zero_balance', query.include_zero_balance.toString())
    }
    const queryString = params.toString()
    const url = `/v2/accounting/accounts-summary${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<AccountsSummary>(url)
    return response.data
  }
}

