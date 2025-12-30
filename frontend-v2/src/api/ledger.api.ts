import apiClient from './client'
import type { PaginatedResponse } from './types'

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
  q?: string
  member_id?: string
  account_type?: string
  meeting_id?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}

// API Functions
export const ledgerApi = {
  async getLedgerEntries(query?: GetLedgerEntriesQuery): Promise<PaginatedResponse<LedgerEntry>> {
    const params = new URLSearchParams()
    if (query?.q) params.append('q', query.q)
    if (query?.member_id) params.append('memberId', query.member_id)
    if (query?.account_type) params.append('accountType', query.account_type)
    if (query?.meeting_id) params.append('meetingId', query.meeting_id)
    if (query?.date_from) params.append('dateFrom', query.date_from)
    if (query?.date_to) params.append('dateTo', query.date_to)
    if (query?.page) params.append('page', query.page.toString())
    if (query?.limit) params.append('limit', query.limit.toString())
    const queryString = params.toString()
    const url = `/ledger-entries${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<PaginatedResponse<LedgerEntry>>(url)
    return response.data
  },

  async getLedgerEntryById(id: string): Promise<LedgerEntry> {
    const response = await apiClient.get<LedgerEntry>(`/ledger-entries/${id}`)
    return response.data
  },

  async getLedgerEntriesByOperation(operationId: string): Promise<LedgerEntry[]> {
    const response = await apiClient.get<LedgerEntry[]>(
      `/ledger-entries/operation/${operationId}`
    )
    return response.data
  },

  async getAccountTypes(): Promise<AccountTypeOption[]> {
    const response = await apiClient.get<AccountTypeOption[]>('/ledger-entries/account-types')
    return response.data
  }
}

