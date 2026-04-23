import { mockApi } from '@/api/mocks'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export interface DashboardMetrics {
  active_members: {
    count: number
    total: number
    change_percent: number
  }
  total_stocks: {
    count: number
    value: number
    change_percent: number
  }
  active_loans: {
    count: number
    in_portfolio: boolean
  }
  total_portfolio: {
    value: number
  }
  overdue_portfolio: {
    value: number
    percent_of_total: number
  }
  monthly_collected: {
    value: number
    change_percent: number
  }
}

export interface MonthlyMovements {
  labels: string[]
  collected: number[]
  disbursed: number[]
}

export interface NextMeeting {
  id: string
  number: number
  date: string
  participants: number
  stock_value: number
  active_loans: number
}

export interface RecentActivity {
  id: string
  type: string
  description: string
  amount: number
  timestamp: string
  member_name: string
}

export interface PortfolioStatus {
  up_to_date: number
  overdue: number
  written_off: number
}

export const dashboardApi = {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    if (USE_MOCKS) {
      return mockApi.getDashboardMetrics()
    }
    // TODO: Implementar llamada real a API
    throw new Error('Not implemented')
  },

  async getMonthlyMovements(): Promise<MonthlyMovements> {
    if (USE_MOCKS) {
      return mockApi.getMonthlyMovements()
    }
    const response = await apiClient.get<MonthlyMovements>('/v2/dashboard/monthly-movements')
    return response.data
  },

  async getNextMeeting(): Promise<NextMeeting> {
    if (USE_MOCKS) {
      return mockApi.getNextMeeting()
    }
    // TODO: Implementar llamada real a API
    throw new Error('Not implemented')
  },

  async getRecentActivity(): Promise<RecentActivity[]> {
    if (USE_MOCKS) {
      return mockApi.getRecentActivity()
    }
    // TODO: Implementar llamada real a API
    throw new Error('Not implemented')
  },

  async getPortfolioStatus(): Promise<PortfolioStatus> {
    if (USE_MOCKS) {
      return mockApi.getPortfolioStatus()
    }
    // TODO: Implementar llamada real a API
    throw new Error('Not implemented')
  }
}

