import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '@/api/client'
import { dashboardApi } from './dashboard.api'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('dashboardApi.getDashboardMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches dashboard metrics from real API endpoint when USE_MOCKS is false', async () => {
    const mockData = {
      active_members: { count: 10, total: 12, change_percent: 2 },
      total_stocks: { count: 100, value: 5000, change_percent: 5 },
      active_loans: { count: 4, in_portfolio: true },
      total_portfolio: { value: 20000 },
      overdue_portfolio: { value: 1000, percent_of_total: 5 },
      monthly_collected: { value: 1500, change_percent: 10 },
    }

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData })

    const result = await dashboardApi.getDashboardMetrics()

    expect(apiClient.get).toHaveBeenCalledWith('/v2/dashboard/metrics')
    expect(result).toEqual(mockData)
  })
})
