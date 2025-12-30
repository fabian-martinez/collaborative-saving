<template>
  <div class="meeting-detail-view">
    <LoadingSpinner :loading="loading" />
    <ErrorMessage :error="error" />
    <div v-if="meeting">
      <h1>Reunión del {{ formatDate(meeting.date) }}</h1>
      <p>Estado: {{ meeting.status }}</p>
      <p v-if="meeting.notes">Notas: {{ meeting.notes }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { meetingsApi, type Meeting } from '@/api/meetings.api'
import { formatDate } from '@/shared/utils/formatters'

const route = useRoute()
const meeting = ref<Meeting | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    meeting.value = await meetingsApi.getMeetingById(route.params.id as string, { include_summary: true })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar reunión'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.meeting-detail-view {
  padding: 2rem;
}
</style>

