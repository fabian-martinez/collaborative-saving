import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { meetingsService } from '../services/meetings'
import type { Meeting } from '../types'

export const useActiveMeetingStore = defineStore('active-meeting', () => {
  const currentStep = ref(1)
  const meetingId = ref<string | null>(null)
  const isMeetingActive = computed(() => !!meetingId.value)
  const totalCollection = ref(0)
  const totalInterest = ref(0)

  // TODO: Add state for collected funds, revaluation results, etc.

  async function fetchActiveMeeting() {
    try {
      const meeting = await meetingsService.getActiveMeeting()
      if (meeting) {
        meetingId.value = meeting.id
      } else {
        meetingId.value = null
      }
    } catch (error) {
      console.error('No active meeting found on server', error)
      meetingId.value = null
    }
  }

  async function startNewMeeting(): Promise<Meeting | undefined> {
    try {
      const newMeeting = await meetingsService.startNewMeeting()
      meetingId.value = newMeeting.id
      currentStep.value = 1
      return newMeeting
    } catch (error) {
      console.error('Error starting new meeting:', error)
      throw error
    }
  }

  function goToStep(step: number) {
    currentStep.value = step
  }

  function setMeetingId(id: string) {
    meetingId.value = id
  }

  function $reset() {
    currentStep.value = 1
    meetingId.value = null
    totalCollection.value = 0
    totalInterest.value = 0
  }

  function updateBalance(collection: number, interest: number) {
    totalCollection.value += collection
    totalInterest.value += interest
  }

  return {
    currentStep,
    meetingId,
    isMeetingActive,
    goToStep,
    setMeetingId,
    fetchActiveMeeting,
    startNewMeeting,
    $reset,
    updateBalance,
    totalCollection,
    totalInterest,
  }
}) 