<template>
  <div v-if="meeting.notes" class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <h2 class="card-title text-xl mb-2">Observaciones</h2>
      <p class="text-base-content/70 italic whitespace-pre-wrap">
        {{ meeting.notes }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Meeting } from '@/api/meetings.api'

defineProps<{
  meeting: Meeting
}>()
</script>

