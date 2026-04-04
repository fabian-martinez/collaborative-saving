<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { 
  Home, 
  User, 
  Database, 
  Calendar, 
  Bank, 
  Settings, 
  Book, 
  InfoCircle, 
  Folder,
  NavArrowLeft,
  LogOut,
} from 'iconoir-vue/regular'
import { useSidebar } from '@/shared/composables/useSidebar'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { useRouter } from 'vue-router'

const route = useRoute()
const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar()

const menuSections = [
  {
    title: 'Principal',
    items: [
      { name: 'Dashboard', to: '/dashboard', icon: Home },
      { name: 'Socios', to: '/members', icon: User },
      { name: 'Acciones', to: '/stocks', icon: Database },
    ],
  },
  {
    title: 'Financiera',
    items: [
      { name: 'Reuniones', to: '/meetings', icon: Calendar },
      { name: 'Préstamos', to: '/loans', icon: Bank },
      { name: 'Libro Contable', to: '/ledger', icon: Book },
    ],
  },
  {
    title: 'Administración',
    items: [
      { name: 'Info del Fondo', to: '/fund-info', icon: InfoCircle },
      { name: 'Documentos', to: '/documents', icon: Folder },
      { name: 'Configuración', to: '/settings', icon: Settings },
    ],
  },
]

// Mock data para próxima reunión - esto vendrá del store después
const nextMeeting = {
  number: 24,
  date: '15 Enero, 2024',
  title: 'Reunión #24'
}

const authStore = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <!-- Overlay para móvil -->
  <div
    v-if="isMobileOpen"
    class="fixed inset-0 bg-black/50 z-40 lg:hidden"
    @click="closeMobile"
  ></div>

  <!-- Sidebar -->
  <aside
    class="min-h-screen bg-[#0a2257] text-white flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out lg:translate-x-0"
    :class="{
      'w-72': !isCollapsed,
      'w-20': isCollapsed,
      '-translate-x-full': !isMobileOpen,
      'translate-x-0 lg:translate-x-0': isMobileOpen
    }"
  >
    <!-- Logo y botón compactar -->
    <div class="p-6 pb-2 flex items-center justify-between">
      <div v-show="!isCollapsed" class="flex-1">
        <div class="text-2xl font-bold tracking-tight">FondoAhorro</div>
        <div class="text-sm text-gray-300 mt-1">Sistema de Gestión</div>
      </div>
      <div v-show="isCollapsed" class="text-2xl font-bold tracking-tight mx-auto">F</div>
      <!-- Botón compactar (solo desktop) -->
      <button
        @click="toggleCollapse"
        class="btn btn-ghost btn-sm lg:block max-lg:hidden text-white hover:bg-blue-800 p-1"
        :class="{ 'ml-auto': !isCollapsed }"
        aria-label="Colapsar menú lateral"
      >
        <NavArrowLeft
          class="w-5 h-5 transition-transform duration-300"
          :class="{ 'rotate-180': isCollapsed }"
        />
      </button>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 overflow-y-auto">
      <ul class="menu px-4 pt-2">
        <template v-for="section in menuSections" :key="section.title">
          <li v-show="!isCollapsed" class="mt-4 mb-1">
            <span class="text-xs text-gray-400 uppercase font-semibold pl-2">{{ section.title }}</span>
          </li>
          <li v-for="item in section.items" :key="item.to" class="mb-1">
            <RouterLink
              :to="item.to"
              @click="closeMobile"
              class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150"
              :class="{
                'bg-blue-700 text-white font-semibold': route.path.startsWith(item.to),
                'hover:bg-blue-900 text-gray-100': !route.path.startsWith(item.to),
                'justify-center': isCollapsed
              }"
              :title="isCollapsed ? item.name : undefined"
            >
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
              <span v-show="!isCollapsed">{{ item.name }}</span>
            </RouterLink>
          </li>
        </template>
      </ul>
    </nav>

    <!-- Next Meeting Reminder -->
    <div
      v-show="!isCollapsed"
      class="p-4 border-t border-blue-800"
    >
      <div class="text-xs text-gray-400 uppercase font-semibold mb-2">Próxima Reunión</div>
      <div class="text-sm font-medium">{{ nextMeeting.date }}</div>
      <div class="text-xs text-gray-300">{{ nextMeeting.title }}</div>
    </div>

    <!-- Logout Button -->
    <div class="p-4 border-t border-blue-800">
      <button
        @click="handleLogout"
        class="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-gray-300 hover:bg-red-900/50 hover:text-white transition-colors duration-150"
        :class="{ 'justify-center': isCollapsed }"
        :title="isCollapsed ? 'Cerrar Sesión' : undefined"
      >
        <LogOut class="w-5 h-5 flex-shrink-0" />
        <span v-show="!isCollapsed">Cerrar Sesión</span>
      </button>
    </div>
  </aside>
</template>

