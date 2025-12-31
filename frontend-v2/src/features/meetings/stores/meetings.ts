import { defineStore } from 'pinia'
import { ref } from 'vue'
import { meetingsApi, type Meeting } from '@/api/meetings.api'
import { ApiException } from '@/api/types'

export const useMeetingsStore = defineStore('meetings', () => {
  const meetings = ref<Meeting[]>([])
  const activeMeeting = ref<Meeting | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMeetings() {
    loading.value = true
    error.value = null
    try {
      meetings.value = await meetingsApi.getMeetings()
    } catch (e) {
      const errorMessage = e instanceof ApiException 
        ? e.message 
        : e instanceof Error 
        ? e.message 
        : 'Error al cargar reuniones'
      error.value = errorMessage
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchActiveMeeting() {
    // No afectar el estado de loading para no interferir con otras operaciones
    // Solo actualizamos activeMeeting silenciosamente
    try {
      activeMeeting.value = await meetingsApi.getActiveMeeting()
      return activeMeeting.value
    } catch (e) {
      // Si no hay reunión activa (404), es un estado válido del sistema
      // Solo establecemos activeMeeting a null sin lanzar error ni afectar el estado de error
      if (e instanceof ApiException && e.status === 404) {
        activeMeeting.value = null
        return null
      }
      // Para otros errores, no los propagamos para no interrumpir la carga de la lista
      // Solo los registramos en consola
      console.error('Error al cargar reunión activa:', e)
      activeMeeting.value = null
      return null
    }
  }

  async function createMeeting(data: Parameters<typeof meetingsApi.createMeeting>[0]) {
    loading.value = true
    error.value = null
    try {
      const newMeeting = await meetingsApi.createMeeting(data)
      meetings.value.unshift(newMeeting)
      // La nueva reunión creada se convierte automáticamente en la reunión activa
      activeMeeting.value = newMeeting
      return newMeeting
    } catch (e) {
      const errorMessage = e instanceof ApiException 
        ? e.message 
        : e instanceof Error 
        ? e.message 
        : 'Error al crear reunión'
      error.value = errorMessage
      throw e
    } finally {
      loading.value = false
    }
  }

  async function closeMeeting(id: string, data?: Parameters<typeof meetingsApi.closeMeeting>[1]) {
    loading.value = true
    error.value = null
    try {
      const closedMeeting = await meetingsApi.closeMeeting(id, data)
      // Actualizar la reunión en la lista
      const index = meetings.value.findIndex(m => m.id === id)
      if (index !== -1) {
        meetings.value[index] = closedMeeting
      }
      // Si la reunión cerrada era la activa, limpiar el estado
      if (activeMeeting.value?.id === id) {
        activeMeeting.value = null
      }
      return closedMeeting
    } catch (e) {
      const errorMessage = e instanceof ApiException 
        ? e.message 
        : e instanceof Error 
        ? e.message 
        : 'Error al cerrar reunión'
      error.value = errorMessage
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    meetings,
    activeMeeting,
    loading,
    error,
    fetchMeetings,
    fetchActiveMeeting,
    createMeeting,
    closeMeeting
  }
})

