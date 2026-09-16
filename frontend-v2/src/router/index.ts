/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { isSignInWithEmailLink } from 'firebase/auth'
import { auth } from '@/shared/firebase/config'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/features/auth/views/LoginView.vue')
  },
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
  },
  {
    path: '/ledger/account/:accountId',
    name: 'account-detail',
    component: () => import('@/features/ledger/views/AccountDetailView.vue')
  },
  {
    path: '/pending-payments',
    name: 'pending-payments',
    component: () => import('@/features/pending-payments/views/PendingPaymentsView.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/features/settings/views/SettingsView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const isMagicLink =
    !!(to.query.apiKey && to.query.oobCode) ||
    (typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href))

  if (to.name === 'login') {
    if (authStore.isAuthenticated && !isMagicLink) {
      return next({ name: 'dashboard' })
    }
    return next()
  }

  if (!authStore.isAuthenticated) {
    if (isMagicLink) {
      return next({ name: 'login', query: to.query })
    }
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  next()
})

export default router

