import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/features/auth/stores/user'
import Dashboard from '@/features/dashboard/views/dashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    // --- Grupo: Principal ---
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard, // Usando HomeView como placeholder
      meta: { title: 'Dashboard' },
    },
    {
      path: '/members',
      name: 'members-list',
      component: () => import('@/features/members/views/MembersView.vue'),
      meta: { title: 'Socios' },
    },
    {
      path: '/members/:id',
      name: 'member-details',
      component: () => import('@/features/members/views/MemberDetailView.vue'),
      meta: { title: 'Detalle del Socio' }
    },
    {
      path: '/stocks',
      name: 'stocks-summary',
      component: () => import('@/features/stocks/views/StocksSummaryView.vue'),
      meta: { title: 'Resumen de Acciones' },
    },
    {
      path: '/stocks/:id',
      name: 'stock-details',
      component: () => import('@/features/stocks/views/StockDetailView.vue'),
      meta: { title: 'Detalles de Acción' }
    },

    // --- Grupo: Financiera ---
    {
      path: '/meetings',
      name: 'meetings',
      component: () => import('@/features/meetings/views/MeetingsView.vue'),
      meta: { title: 'Historial de Reuniones' },
    },
    {
      path: '/meetings/:id',
      name: 'meeting-details',
      component: () => import('@/features/meetings/views/MeetingDetailView.vue'),
      meta: { title: 'Detalle de la Reunión' },
    },
    {
      path: '/meetings/active',
      name: 'active-meeting',
      component: () => import('@/features/meetings/views/ActiveMeetingView.vue'),
      meta: { title: 'Reunión Activa' },
    },
    // {
    //   path: '/loans',
    //   name: 'loans-list',
    //   component: () => import('@/views/loans/LoansListView.vue'),
    //   meta: { title: 'Préstamos' }
    // },
    {
      path: '/ledger',
      name: 'ledger',
      component: () => import('@/features/ledger/views/LedgerView.vue'),
      meta: { title: 'Libro Contable' }
    },

    // --- Grupo: Administración ---
    // {
    //   path: '/fund-info',
    //   name: 'fund-info',
    //   component: () => import('@/views/admin/FundInfoView.vue'),
    //   meta: { title: 'Información del Fondo' }
    // },
    // {
    //   path: '/documents',
    //   name: 'documents',
    //   component: () => import('@/views/admin/DocumentsView.vue'),
    //   meta: { title: 'Documentación' }
    // },
    // {
    //   path: '/settings',
    //   name: 'settings',
    //   component: () => import('@/views/admin/SettingsView.vue'),
    //   meta: { title: 'Configuración' }
    // }
  ],
})

router.beforeEach(async (to, from, next) => {
  // La lógica de autenticación y autorización se re-implementará aquí
  // según las nuevas especificaciones.
  const userStore = useUserStore()
  if (!userStore.role) {
    await userStore.fetchRole()
  }
  next()
})

export default router
