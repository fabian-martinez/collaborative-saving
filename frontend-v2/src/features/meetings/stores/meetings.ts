import { defineStore } from 'pinia'
import { ref } from 'vue'
import { meetingsApi, type Meeting } from '@/api/meetings.api'

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
      error.value = e instanceof Error ? e.message : 'Error al cargar reuniones'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchActiveMeeting() {
    loading.value = true
    error.value = null
    try {
      activeMeeting.value = await meetingsApi.getActiveMeeting()
      return activeMeeting.value
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar reunión activa'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createMeeting(data: Parameters<typeof meetingsApi.createMeeting>[0]) {
    loading.value = true
    error.value = null
    try {
      const newMeeting = await meetingsApi.createMeeting(data)
      meetings.value.unshift(newMeeting)
      activeMeeting.value = newMeeting
      return newMeeting
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al crear reunión'
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
    createMeeting
  }
})

