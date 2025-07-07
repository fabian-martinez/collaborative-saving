<template>
  <div>
    <h2 class="text-xl font-bold">Paso 4: Desembolsos y Cierre</h2>
    <p>Aquí se registrarán los desembolsos de créditos y se finalizará la reunión.</p>

    <div class="mt-4">
      <button @click="finishMeeting" class="btn btn-primary">Finalizar Reunión</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useActiveMeetingStore } from '@/features/meetings/stores/activeMeeting'
import { meetingsService } from '@/features/meetings/services/meetings'
import { useRouter } from 'vue-router'

const activeMeetingStore = useActiveMeetingStore()
const router = useRouter()

async function finishMeeting() {
  if (!activeMeetingStore.meetingId) {
    console.error('No hay una reunión activa para finalizar.')
    return
  }
  try {
    await meetingsService.closeMeeting(activeMeetingStore.meetingId)
    // Resetear el estado de la reunión activa
    activeMeetingStore.$reset()
    // Redirigir a la lista de reuniones
    router.push({ name: 'meetings' })
  } catch (error) {
    console.error('Error al finalizar la reunión:', error)
    // Aquí podrías mostrar una notificación al usuario
  }
}
</script> 