/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import apiClient from './client'

export interface LoanType {
  id: string
  code: string
  name: string
  interest_rate: number
  description?: string | null
  created_at: string | Date
  updated_at: string | Date
}

export interface CreateLoanTypeRequest {
  name: string
  code?: string
  interest_rate: number
  description?: string | null
}

export interface UpdateLoanTypeRequest {
  name?: string
  interest_rate?: number
  description?: string | null
}

export const settingsApi = {
  async getLoanTypes(): Promise<LoanType[]> {
    const response = await apiClient.get<LoanType[]>('/v2/loan-types')
    return response.data
  },

  async getLoanTypeById(id: string): Promise<LoanType> {
    const response = await apiClient.get<LoanType>(`/v2/loan-types/${id}`)
    return response.data
  },

  async createLoanType(data: CreateLoanTypeRequest): Promise<LoanType> {
    const response = await apiClient.post<LoanType>('/v2/loan-types', data)
    return response.data
  },

  async updateLoanType(id: string, data: UpdateLoanTypeRequest): Promise<LoanType> {
    const response = await apiClient.patch<LoanType>(`/v2/loan-types/${id}`, data)
    return response.data
  },

  async deleteLoanType(id: string): Promise<void> {
    await apiClient.delete(`/v2/loan-types/${id}`)
  }
}
