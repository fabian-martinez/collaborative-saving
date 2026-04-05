<template>
  <div class="meeting-header space-y-4">
    <div>
      <h1 class="text-3xl font-bold">Reunión #{{ meetingNumber }}</h1>
      <p class="text-lg text-base-content/70 mt-1">
        {{ formatDateFullSpanish(meeting.date) }}
      </p>
    </div>

    <!-- Banner de Estado Cerrado -->
    <div
      v-if="meeting.status === 'closed'"
      class="alert bg-base-200 border-base-300"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="stroke-current shrink-0 w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
      <div>
        <h3 class="font-bold text-base-content/70">Reunión Cerrada</h3>
        <div class="text-sm text-base-content/60">
          Esta reunión está cerrada. Los datos son de solo lectura.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDateFullSpanish } from '@/shared/utils/formatters'
import type { Meeting } from '@/api/meetings.api'

defineProps<{
  meeting: Meeting
  meetingNumber: number
}>()
</script>

<style scoped>
.meeting-header {
  margin-bottom: 2rem;
}
</style>
