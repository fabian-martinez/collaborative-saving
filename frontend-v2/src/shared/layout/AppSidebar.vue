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
} from 'iconoir-vue/regular'

const route = useRoute()

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
</script>

<template>
  <aside class="w-72 min-h-screen bg-[#0a2257] text-white flex flex-col fixed left-0 top-0 z-10">
    <!-- Logo -->
    <div class="p-6 pb-2">
      <div class="text-2xl font-bold tracking-tight">FondoAhorro</div>
      <div class="text-sm text-gray-300 mt-1">Sistema de Gestión</div>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 overflow-y-auto">
      <ul class="menu px-4 pt-2">
        <template v-for="section in menuSections" :key="section.title">
          <li class="mt-4 mb-1">
            <span class="text-xs text-gray-400 uppercase font-semibold pl-2">{{ section.title }}</span>
          </li>
          <li v-for="item in section.items" :key="item.to" class="mb-1">
            <RouterLink
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150"
              :class="route.path.startsWith(item.to) ? 'bg-blue-700 text-white font-semibold' : 'hover:bg-blue-900 text-gray-100'"
            >
              <component :is="item.icon" class="w-5 h-5" />
              <span>{{ item.name }}</span>
            </RouterLink>
          </li>
        </template>
      </ul>
    </nav>

    <!-- Next Meeting Reminder -->
    <div class="p-4 border-t border-blue-800">
      <div class="text-xs text-gray-400 uppercase font-semibold mb-2">Próxima Reunión</div>
      <div class="text-sm font-medium">{{ nextMeeting.date }}</div>
      <div class="text-xs text-gray-300">{{ nextMeeting.title }}</div>
    </div>
  </aside>
</template>

