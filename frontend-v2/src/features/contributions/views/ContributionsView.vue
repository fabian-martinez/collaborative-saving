<template>
  <div class="contributions-view">
    <div class="view-header">
      <h1>Contribuciones Obligatorias</h1>
      <button @click="showCreateModal = true" class="create-button">Nueva Contribución</button>
    </div>

    <LoadingSpinner :loading="loading" />
    <ErrorMessage :error="error" />

    <DataTable
      v-if="!loading && !error"
      :data="contributions"
      :columns="columns"
      :actions="true"
      empty-message="No hay contribuciones registradas"
      row-key="id"
    >
      <template #actions="{ item }">
        <button @click="deleteContribution(item.id)" class="action-button danger">Eliminar</button>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { contributionsApi, type MandatoryContribution } from '@/api/contributions.api'
import DataTable, { type Column } from '@/shared/components/DataTable.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'

const contributions = ref<MandatoryContribution[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showCreateModal = ref(false)

const columns: Column[] = [
  { key: 'asset_type', label: 'Tipo de Activo' },
  { key: 'value', label: 'Valor', format: 'currency' }
]

onMounted(async () => {
  loading.value = true
  try {
    contributions.value = await contributionsApi.getContributions()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar contribuciones'
  } finally {
    loading.value = false
  }
})

async function deleteContribution(id: string) {
  if (confirm('¿Está seguro de eliminar esta contribución?')) {
    try {
      await contributionsApi.deleteContribution(id)
      contributions.value = contributions.value.filter(c => c.id !== id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al eliminar contribución'
    }
  }
}
</script>

<style scoped>
.contributions-view {
  padding: 2rem;
}

.view-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.create-button {
  background-color: #27ae60;
  color: white;
  padding: 0.75rem 1.5rem;
}

.action-button.danger {
  background-color: #e74c3c;
  color: white;
}
</style>

