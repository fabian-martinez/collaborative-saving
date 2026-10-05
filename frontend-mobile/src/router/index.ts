/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import {
  createRouter,
  createWebHistory,
  createMemoryHistory,
  type RouteRecordRaw,
} from 'vue-router';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { isSignInWithEmailLink } from 'firebase/auth';
import { auth } from '@/shared/firebase/config';

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/features/auth/views/LoginView.vue'),
    meta: { layout: 'auth', public: true },
  },
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/features/home/views/HomeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/fund',
    name: 'fund',
    component: () => import('@/features/fund/views/FundView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/members',
    name: 'members',
    component: () => import('@/features/members/views/MembersView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('@/features/history/views/HistoryView.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history:
    typeof window !== 'undefined'
      ? createWebHistory()
      : createMemoryHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  if (!authStore.initialized) {
    await authStore.init();
  }

  const isMagicLink =
    !!(to.query.apiKey && to.query.oobCode) ||
    (typeof window !== 'undefined' &&
      isSignInWithEmailLink(auth, window.location.href));

  if (to.name === 'login') {
    if (authStore.isAuthenticated && !isMagicLink) {
      return next({ name: 'home' });
    }
    return next();
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  if (requiresAuth && !authStore.isAuthenticated) {
    if (isMagicLink) {
      return next({ name: 'login', query: to.query });
    }
    return next({ name: 'login' });
  }

  next();
});

export default router;
