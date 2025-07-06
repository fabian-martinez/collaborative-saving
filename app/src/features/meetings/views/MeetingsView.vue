<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { meetingsService } from '@/features/meetings/services/meetings'
import type { Meeting } from '@/features/meetings/types'

const meetings = ref<Meeting[]>([])
const loading = ref(false)
const hasActiveMeeting = ref(false)

async function getMeetings() {
  try {
    loading.value = true
    const data = await meetingsService.getMeetings()
    meetings.value = data
    hasActiveMeeting.value = data.some((m) => m.status === 'active')
  } catch (err) {
    console.error('Error fetching meetings:', err)
  } finally {
    loading.value = false
  }
}

async function startNewMeeting() {
  if (hasActiveMeeting.value) {
    alert('There is already an active meeting. Please close it before starting a new one.')
    return
  }

  try {
    loading.value = true
    await meetingsService.startNewMeeting()
    alert('New meeting started successfully!')
    await getMeetings() // Refresh the list
  } catch (err) {
    console.error('Error starting new meeting:', err)
  } finally {
    loading.value = false
  }
}

async function closeMeeting(meetingId: string) {
  if (!confirm('Are you sure you want to close this meeting? This action cannot be undone.')) {
    return
  }

  try {
    loading.value = true
    await meetingsService.closeMeeting(meetingId)
    alert('Meeting closed successfully!')
    await getMeetings() // Refresh the list
  } catch (err) {
    console.error('Error closing meeting:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getMeetings()
})
</script>

<template>
  <div>
    <div class="container mx-auto pt-12 pb-24">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Meetings</h1>
        <button class="btn btn-primary" @click="startNewMeeting" :disabled="loading || hasActiveMeeting">
          Start New Meeting
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="meeting in meetings" :key="meeting.id">
              <td>{{ new Date(meeting.date).toLocaleDateString() }}</td>
              <td>
                <span class="badge" :class="{ 'badge-success': meeting.status === 'active', 'badge-ghost': meeting.status === 'closed' }">
                  {{ meeting.status }}
                </span>
              </td>
              <td>
                <router-link
                  v-if="meeting.status === 'active'"
                  :to="`/admin/meetings/active`"
                  class="btn btn-sm btn-outline mr-2"
                >
                  Go to Meeting
                </router-link>
                <button
                  v-if="meeting.status === 'active'"
                  @click="closeMeeting(meeting.id)"
                  class="btn btn-sm btn-error"
                  :disabled="loading"
                >
                  Close Meeting
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template> 