import apiClient from './client'

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
    const response = await apiClient.get<MandatoryContribution[]>('/v2/mandatory-contributions')
    return response.data
  },

  async createContribution(
    data: CreateMandatoryContributionRequest
  ): Promise<MandatoryContribution> {
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
    const response = await apiClient.patch<MandatoryContribution>(
      `/v2/mandatory-contributions/${id}`,
      data
    )
    return response.data
  },

  async deleteContribution(id: string): Promise<void> {
    await apiClient.delete(`/v2/mandatory-contributions/${id}`)
  }
}

