<template>
  <div class="active-meeting-view">
    <h1>Reunión Activa</h1>
    <LoadingSpinner :loading="loading" />
    <ErrorMessage :error="error" />
    <div v-if="meeting">
      <p>Fecha: {{ formatDate(meeting.date) }}</p>
      <p>Estado: {{ meeting.status }}</p>
      <!-- TODO: Implementar pasos de reunión activa -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMeetingsStore } from '../stores/meetings'
import { formatDate } from '@/shared/utils/formatters'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'

const store = useMeetingsStore()
const loading = ref(false)
const error = ref<string | null>(null)

const meeting = computed(() => store.activeMeeting)

onMounted(async () => {
  loading.value = true
  try {
    await store.fetchActiveMeeting()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar reunión activa'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.active-meeting-view {
  padding: 2rem;
}
</style>

