import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dashboardApi } from '../api/dashboard.api'
import type {
  DashboardMetrics,
  MonthlyMovements,
  NextMeeting,
  RecentActivity,
  PortfolioStatus
} from '../api/dashboard.api'

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const metrics = ref<DashboardMetrics | null>(null)
  const monthlyMovements = ref<MonthlyMovements | null>(null)
  const nextMeeting = ref<NextMeeting | null>(null)
  const recentActivity = ref<RecentActivity[]>([])
  const portfolioStatus = ref<PortfolioStatus | null>(null)

  // Actions
  async function fetchDashboardData() {
    loading.value = true
    error.value = null
    try {
      await Promise.all([
        fetchMetrics(),
        fetchMonthlyMovements(),
        fetchNextMeeting(),
        fetchRecentActivity(),
        fetchPortfolioStatus()
      ])
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar datos del dashboard'
      console.error('Error fetching dashboard data:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchMetrics() {
    try {
      metrics.value = await dashboardApi.getDashboardMetrics()
    } catch (e) {
      console.error('Error fetching metrics:', e)
      throw e
    }
  }

  async function fetchMonthlyMovements() {
    try {
      monthlyMovements.value = await dashboardApi.getMonthlyMovements()
    } catch (e) {
      console.error('Error fetching monthly movements:', e)
      throw e
    }
  }

  async function fetchNextMeeting() {
    try {
      nextMeeting.value = await dashboardApi.getNextMeeting()
    } catch (e) {
      console.error('Error fetching next meeting:', e)
      throw e
    }
  }

  async function fetchRecentActivity() {
    try {
      recentActivity.value = await dashboardApi.getRecentActivity()
    } catch (e) {
      console.error('Error fetching recent activity:', e)
      throw e
    }
  }

  async function fetchPortfolioStatus() {
    try {
      portfolioStatus.value = await dashboardApi.getPortfolioStatus()
    } catch (e) {
      console.error('Error fetching portfolio status:', e)
      throw e
    }
  }

  // Computed
  const hasData = computed(() => {
    return !!(
      metrics.value &&
      monthlyMovements.value &&
      nextMeeting.value &&
      recentActivity.value.length > 0 &&
      portfolioStatus.value
    )
  })

  return {
    // State
    loading,
    error,
    metrics,
    monthlyMovements,
    nextMeeting,
    recentActivity,
    portfolioStatus,
    // Actions
    fetchDashboardData,
    fetchMetrics,
    fetchMonthlyMovements,
    fetchNextMeeting,
    fetchRecentActivity,
    fetchPortfolioStatus,
    // Computed
    hasData
  }
})
