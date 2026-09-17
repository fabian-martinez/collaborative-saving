/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '@/features/home/views/HomeView.vue';
import FundView from '@/features/fund/views/FundView.vue';
import MembersView from '@/features/members/views/MembersView.vue';
import HistoryView from '@/features/history/views/HistoryView.vue';
import LoginView from '@/features/auth/views/LoginView.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { isSignInWithEmailLink } from 'firebase/auth';
import { auth } from '@/shared/firebase/config';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { layout: AuthLayout, public: true }
  },
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'home',
    component: HomeView,
    meta: { layout: AppLayout }
  },
  {
    path: '/fund',
    name: 'fund',
    component: FundView,
    meta: { layout: AppLayout }
  },
  {
    path: '/members',
    name: 'members',
    component: MembersView,
    meta: { layout: AppLayout }
  },
  {
    path: '/history',
    name: 'history',
    component: HistoryView,
    meta: { layout: AppLayout }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  if (!authStore.initialized) {
    await authStore.init();
  }

  const isMagicLink =
    !!(to.query.apiKey && to.query.oobCode) ||
    (typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href));

  if (to.name === 'login') {
    if (authStore.isAuthenticated && !isMagicLink) {
      return next({ name: 'home' });
    }
    return next();
  }

  const isPublic = to.matched.some((record) => record.meta.public);
  if (!isPublic && !authStore.isAuthenticated) {
    if (isMagicLink) {
      return next({ name: 'login', query: to.query });
    }
    return next({ name: 'login' });
  }

  next();
});

export default router;
