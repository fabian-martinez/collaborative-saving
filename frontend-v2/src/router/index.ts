import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/features/dashboard/views/DashboardView.vue')
  },
  {
    path: '/members',
    name: 'members',
    component: () => import('@/features/members/views/MembersView.vue')
  },
  {
    path: '/members/:id',
    name: 'member-detail',
    component: () => import('@/features/members/views/MemberDetailView.vue')
  },
  {
    path: '/meetings',
    name: 'meetings',
    component: () => import('@/features/meetings/views/MeetingsView.vue')
  },
  {
    path: '/meetings/active',
    name: 'active-meeting',
    component: () => import('@/features/meetings/views/ActiveMeetingView.vue')
  },
  {
    path: '/meetings/:id',
    name: 'meeting-detail',
    component: () => import('@/features/meetings/views/MeetingDetailView.vue')
  },
  {
    path: '/loans',
    name: 'loans',
    component: () => import('@/features/loans/views/LoansView.vue')
  },
  {
    path: '/loans/:id',
    name: 'loan-detail',
    component: () => import('@/features/loans/views/LoanDetailView.vue')
  },
  {
    path: '/stocks',
    name: 'stocks',
    component: () => import('@/features/stocks/views/StocksView.vue')
  },
  {
    path: '/stocks/:id',
    name: 'stock-detail',
    component: () => import('@/features/stocks/views/StockDetailView.vue')
  },
  {
    path: '/contributions',
    name: 'contributions',
    component: () => import('@/features/contributions/views/ContributionsView.vue')
  },
  {
    path: '/ledger',
    name: 'ledger',
    component: () => import('@/features/ledger/views/LedgerView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

