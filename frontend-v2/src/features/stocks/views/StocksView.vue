<template>
  <div class="stocks-view">
    <h1>Acciones</h1>
    <LoadingSpinner :loading="loading" />
    <ErrorMessage :error="error" />
    <DataTable
      v-if="!loading && !error"
      :data="stocks"
      :columns="columns"
      :actions="true"
      empty-message="No hay acciones registradas"
      row-key="id"
    >
      <template #actions="{ item }">
        <button @click="viewStock(item.id)" class="action-button">Ver</button>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { stocksApi, type Stock } from '@/api/stocks.api'
import DataTable from '@/shared/components/DataTable.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'

const router = useRouter()
const stocks = ref<Stock[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const columns = [
  { key: 'type', label: 'Tipo' },
  { key: 'value', label: 'Valor', format: 'currency' },
  { key: 'monthly_contribution', label: 'Aporte Mensual', format: 'currency' },
  { key: 'is_guaranteed', label: 'Garantizada' },
  { key: 'behavior', label: 'Comportamiento' }
]

onMounted(async () => {
  loading.value = true
  try {
    stocks.value = await stocksApi.getStocks()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar acciones'
  } finally {
    loading.value = false
  }
})

function viewStock(id: string) {
  router.push(`/stocks/${id}`)
}
</script>

<style scoped>
.stocks-view {
  padding: 2rem;
}

.action-button {
  padding: 0.25rem 0.5rem;
  background-color: #3498db;
  color: white;
}
</style>

