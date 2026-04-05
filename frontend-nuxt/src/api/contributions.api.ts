import apiClient from './client'
import { mockApi } from './mocks'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

// Tipos en snake_case según respuestas del backend
export interface MandatoryContribution {
  id: string
  asset_type: string
  value: number
}

export interface CreateMandatoryContributionRequest {
  asset_type: string
  value: number
}

export interface UpdateMandatoryContributionRequest {
  asset_type?: string
  value?: number
}

// API Functions
export const contributionsApi = {
  async getContributions(): Promise<MandatoryContribution[]> {
    if (USE_MOCKS) {
      return mockApi.getContributions()
    }
    const response = await apiClient.get<MandatoryContribution[]>('/v2/mandatory-contributions')
    return response.data
  },

  async createContribution(
    data: CreateMandatoryContributionRequest
  ): Promise<MandatoryContribution> {
    if (USE_MOCKS) {
      return mockApi.createContribution(data)
    }
    const response = await apiClient.post<MandatoryContribution>(
      '/v2/mandatory-contributions',
      data
    )
    return response.data
  },

  async updateContribution(
    id: string,
    data: UpdateMandatoryContributionRequest
  ): Promise<MandatoryContribution> {
    if (USE_MOCKS) {
      return mockApi.updateContribution(id, data)
    }
    const response = await apiClient.patch<MandatoryContribution>(
      `/v2/mandatory-contributions/${id}`,
      data
    )
    return response.data
  },

  async deleteContribution(id: string): Promise<void> {
    if (USE_MOCKS) {
      return mockApi.deleteContribution(id)
    }
    await apiClient.delete(`/v2/mandatory-contributions/${id}`)
  },

  async getContributionById(id: string): Promise<MandatoryContribution> {
    if (USE_MOCKS) {
      return mockApi.getContributionById(id)
    }
    const response = await apiClient.get<MandatoryContribution>(
      `/v2/mandatory-contributions/${id}`
    )
    return response.data
  }
}
