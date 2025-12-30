<template>
  <div class="meetings-view">
    <div class="view-header">
      <h1>Reuniones</h1>
      <button @click="createMeeting" class="create-button">Nueva Reunión</button>
    </div>

    <LoadingSpinner :loading="store.loading" />
    <ErrorMessage :error="store.error" />

    <DataTable
      v-if="!store.loading && !store.error"
      :data="store.meetings"
      :columns="columns"
      :actions="true"
      empty-message="No hay reuniones registradas"
      row-key="id"
    >
      <template #actions="{ item }">
        <button @click="viewMeeting(item.id)" class="action-button">Ver</button>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMeetingsStore } from '../stores/meetings'
import DataTable from '@/shared/components/DataTable.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'

const router = useRouter()
const store = useMeetingsStore()

const columns = [
  { key: 'date', label: 'Fecha', format: 'date' },
  { key: 'status', label: 'Estado' },
  { key: 'notes', label: 'Notas' }
]

onMounted(() => {
  store.fetchMeetings()
})

function viewMeeting(id: string) {
  router.push(`/meetings/${id}`)
}

async function createMeeting() {
  try {
    await store.createMeeting({ date: new Date().toISOString() })
    router.push('/meetings/active')
  } catch (e) {
    console.error('Error creating meeting', e)
  }
}
</script>

<style scoped>
.meetings-view {
  padding: 2rem;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.create-button {
  background-color: #27ae60;
  color: white;
  padding: 0.75rem 1.5rem;
}

.action-button {
  padding: 0.25rem 0.5rem;
  background-color: #3498db;
  color: white;
}
</style>

