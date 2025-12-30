<template>
  <div class="flex h-screen bg-base-300">
    <AppSidebar />
    <div
      class="flex flex-1 flex-col ml-0 transition-all duration-300"
      :class="{
        'lg:ml-72': !isCollapsed,
        'lg:ml-20': isCollapsed
      }"
    >
      <AppHeader />
      <main class="flex-1 p-6 overflow-y-auto mt-16">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppSidebar from '@/shared/layout/AppSidebar.vue'
import AppHeader from '@/shared/layout/AppHeader.vue'
import { useSidebar } from '@/shared/composables/useSidebar'
import { useMeetingsStore } from '@/features/meetings/stores/meetings'

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

