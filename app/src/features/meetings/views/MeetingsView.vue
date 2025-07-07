<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { meetingsService } from '@/features/meetings/services/meetings'
import type { Meeting } from '@/features/meetings/types'

const meetings = ref<Meeting[]>([])
const loading = ref(false)

const activeMeeting = computed(() => meetings.value.find((m) => m.status === 'active'))
const pastMeetings = computed(() => meetings.value.filter((m) => m.status === 'closed'))
const hasActiveMeeting = computed(() => !!activeMeeting.value)

async function getMeetings() {
  try {
    loading.value = true
    const data = await meetingsService.getMeetings()
    meetings.value = data
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

onMounted(() => {
  getMeetings()
})
</script>

<template>
  <div>
    <div class="container mx-auto pt-12 pb-24">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Meetings</h1>
        <button
          class="btn btn-primary"
          @click="startNewMeeting"
          :disabled="loading || hasActiveMeeting"
        >
          Start New Meeting
        </button>
      </div>

      <div v-if="activeMeeting" class="card bg-base-100 shadow-xl mb-8 border border-primary">
        <div class="card-body">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="card-title text-primary">Active Meeting</h2>
              <p>Started on: {{ new Date(activeMeeting.date).toLocaleDateString() }}</p>
            </div>
            <div class="card-actions">
              <router-link :to="`/meetings/active`" class="btn btn-primary btn-outline">
                Go to Meeting
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <h2 class="text-2xl font-bold mb-4">Past Meetings</h2>
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
            <tr v-if="pastMeetings.length === 0">
              <td colspan="3" class="text-center">No past meetings found.</td>
            </tr>
            <tr v-for="meeting in pastMeetings" :key="meeting.id">
              <td>{{ new Date(meeting.date).toLocaleDateString() }}</td>
              <td>
                <span class="badge badge-ghost">
                  {{ meeting.status }}
                </span>
              </td>
              <td>
                <router-link
                  :to="`/meetings/${meeting.id}`"
                  class="btn btn-sm btn-outline"
                >
                  View Details
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template> 