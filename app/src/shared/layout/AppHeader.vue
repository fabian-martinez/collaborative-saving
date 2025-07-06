<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const pageTitle = computed(() => route.meta.title || 'Dashboard')

// Placeholder for meeting status
const isMeetingActive = ref(false)

function startNewMeeting() {
  // Logic to start a new meeting
  console.log('Iniciando nueva reunión...')
  isMeetingActive.value = true
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
          <button class="btn btn-primary btn-sm">Ir a la Reunión</button>
        </div>
        <div v-else>
          <button @click="startNewMeeting" class="btn btn-primary">Iniciar Nueva Reunión</button>
        </div>
      </div>
    </div>
  </header>
</template> 