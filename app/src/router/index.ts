import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/admin/contributions',
      name: 'admin-contributions',
      component: () => import('../views/admin/ContributionsView.vue')
    },
    {
      path: '/admin/meetings',
      name: 'admin-meetings',
      component: () => import('../views/admin/MeetingsView.vue')
    },
    {
      path: '/admin/meetings/active',
      name: 'admin-active-meeting',
      component: () => import('../views/admin/ActiveMeetingView.vue')
    }
  ],
})

export default router
