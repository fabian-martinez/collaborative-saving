<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useActiveMeetingStore } from '@/features/meetings/stores/activeMeeting'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const pageTitle = computed(() => route.meta.title || 'Dashboard')

const activeMeetingStore = useActiveMeetingStore()
const { isMeetingActive } = storeToRefs(activeMeetingStore)

onMounted(() => {
  activeMeetingStore.fetchActiveMeeting()
})

async function startNewMeeting() {
  try {
    const newMeeting = await activeMeetingStore.startNewMeeting()
    if (newMeeting) {
      router.push({ name: 'active-meeting' })
    }
  } catch (error) {
    console.error('Error al iniciar la reunión:', error)
  }
}

function goToActiveMeeting() {
  router.push({ name: 'active-meeting' })
}
</script>

<template>
  <header class="bg-base-100 p-4 shadow-md">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ pageTitle }}</h1>
        <p class="text-sm text-base-content/70">Un banner decorativo aquí</p>
      </div>

      <div class="flex items-center gap-4">
        <div v-if="isMeetingActive" class="flex items-center gap-2">
          <span class="badge badge-error animate-pulse">Reunión Activa</span>
          <button @click="goToActiveMeeting" class="btn btn-primary btn-sm">Ir a la Reunión</button>
        </div>
        <div v-else>
          <button @click="startNewMeeting" class="btn btn-primary">Iniciar Nueva Reunión</button>
        </div>
      </div>
    </div>
  </header>
</template> 