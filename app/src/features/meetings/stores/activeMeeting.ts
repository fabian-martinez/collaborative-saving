import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { meetingsService } from '../services/meetings'
import { membersService } from '@/features/members/services/membersService'
import type { Meeting } from '../types'
import type { Member } from '@/features/members/types'

export const useActiveMeetingStore = defineStore('active-meeting', () => {
  const currentStep = ref(1)
  const meetingId = ref<string | null>(null)
  const isMeetingActive = computed(() => !!meetingId.value)
  const totalCollection = ref(0)
  const totalInterest = ref(0)
  const members = ref<Member[]>([])
  const isMembersLoading = ref(false)
  const membersError = ref<string | null>(null)

  // TODO: Add state for collected funds, revaluation results, etc.

  async function fetchActiveMeeting() {
    try {
      const meeting = await meetingsService.findActive()
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

  async function fetchMembers() {
    isMembersLoading.value = true
    membersError.value = null
    try {
      members.value = await membersService.getMembers()
    } catch (err: unknown) {
      const error = err as { message?: string };
      membersError.value = error.message || 'Error al cargar los socios.'
    } finally {
      isMembersLoading.value = false
    }
  }

  async function startNewMeeting(): Promise<Meeting | undefined> {
    try {
      const newMeeting = await meetingsService.create({ date: new Date().toISOString() })
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

  function setTotalCollection(amount: number) {
    totalCollection.value = amount
  }

  function setTotalInterest(amount: number) {
    totalInterest.value = amount
  }

  function $reset() {
    currentStep.value = 1
    meetingId.value = null
    totalCollection.value = 0
    totalInterest.value = 0
    members.value = []
    isMembersLoading.value = false
    membersError.value = null
  }

  function updateBalance(collection: number, interest: number) {
    totalCollection.value += collection
    totalInterest.value += interest
  }

  return {
    currentStep,
    meetingId,
    isMeetingActive,
    members,
    isMembersLoading,
    membersError,
    goToStep,
    setMeetingId,
    fetchActiveMeeting,
    fetchMembers,
    startNewMeeting,
    $reset,
    updateBalance,
    setTotalCollection,
    setTotalInterest,
    totalCollection,
    totalInterest,
  }
}) 