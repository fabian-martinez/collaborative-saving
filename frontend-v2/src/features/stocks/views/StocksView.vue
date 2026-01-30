<template>
  <div class="stocks-view">
    <div class="view-header">
      <h1>Acciones</h1>
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por tipo o comportamiento..."
          class="input input-bordered w-64 pl-10"
        />
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>
    </div>
    <LoadingSpinner :loading="loading" />
    <ErrorMessage :error="error" />
    <DataTable
      v-if="!loading && !error"
      :data="filteredItems"
      :columns="columns"
      :actions="true"
      :empty-message="searchQuery ? 'No se encontraron acciones' : 'No hay acciones registradas'"
      row-key="id"
    >
      <template #actions="{ item }">
        <button @click="viewStock(item.id)" class="action-button">Ver</button>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from 'iconoir-vue/regular'
import { stocksApi, type Stock } from '@/api/stocks.api'
import { useSearchableList } from '@/shared/composables/useSearchableList'
import DataTable, { type Column } from '@/shared/components/DataTable.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'

const router = useRouter()
const stocks = ref<Stock[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Búsqueda contextual
const stocksRef = computed(() => stocks.value)
const { searchQuery, filteredItems } = useSearchableList<Stock>(stocksRef, [
  'type',
  'behavior'
])

const columns: Column[] = [
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

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.view-header h1 {
  margin: 0;
}

.action-button {
  padding: 0.25rem 0.5rem;
  background-color: #3498db;
  color: white;
}
</style>

