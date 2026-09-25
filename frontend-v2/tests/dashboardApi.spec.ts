import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dashboardApi } from '../src/features/dashboard/api/dashboard.api'
import apiClient from '../src/api/client'
import { mockApi } from '../src/api/mocks'

vi.mock('../src/api/client', () => ({
  default: {
    get: vi.fn()
  }
}))

vi.mock('../src/api/mocks', () => ({
  mockApi: {
    getDashboardMetrics: vi.fn(),
    getMonthlyMovements: vi.fn(),
    getNextMeeting: vi.fn(),
    getRecentActivity: vi.fn(),
    getPortfolioStatus: vi.fn()
  }
}))

describe('dashboardApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRecentActivity', () => {
    it('should call apiClient.get when USE_MOCKS is false', async () => {
      const mockActivities = [
        {
          id: '1',
          type: 'MANDATORY_CONTRIBUTION',
          description: 'Aporte mensual',
          amount: 150000,
          timestamp: '2024-03-01T10:00:00Z',
          member_name: 'María González'
        }
      ]

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockActivities })

      const result = await dashboardApi.getRecentActivity()

      expect(apiClient.get).toHaveBeenCalledWith('/v2/dashboard/recent-activity')
      expect(result).toEqual(mockActivities)
    })
  })
})
