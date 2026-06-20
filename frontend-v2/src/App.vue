<template>
  <div v-if="route.name === 'login'" class="h-screen w-screen bg-base-200">
    <router-view />
  </div>
  <div v-else class="flex h-screen bg-base-300">
    <AppSidebar />
    <div
      class="flex flex-1 flex-col ml-0 transition-all duration-300"
      :class="{
        'lg:ml-72': !isCollapsed,
        'lg:ml-20': isCollapsed
      }"
    >
      <AppHeader />
      <main
        class="flex-1 mt-12 min-h-0"
        :class="{
          'p-6 overflow-y-auto': route.name !== 'active-meeting',
          'p-0 overflow-hidden flex flex-col h-[calc(100vh-3rem)]': route.name === 'active-meeting'
        }"
      >
        <router-view />
      </main>
    </div>
  </div>
  <ToastContainer />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/shared/layout/AppSidebar.vue'
import AppHeader from '@/shared/layout/AppHeader.vue'
import { useSidebar } from '@/shared/composables/useSidebar'
import { useMeetingsStore } from '@/features/meetings/stores/meetings'
import ToastContainer from '@/shared/components/ToastContainer.vue'

const route = useRoute()
const { isCollapsed } = useSidebar()
const meetingsStore = useMeetingsStore()

// Cargar la reunión activa global al iniciar la aplicación
onMounted(async () => {
  try {
    await meetingsStore.fetchActiveMeeting()
  } catch (error) {
    // Si no hay reunión activa, el error se maneja silenciosamente
    // ya que es un estado válido del sistema
    console.debug('No hay reunión activa:', error)
  }
})
</script>

