<template>
  <div class="loans-view">
    <div class="view-header">
      <h1>Préstamos</h1>
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por tipo o estado..."
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
      :empty-message="searchQuery ? 'No se encontraron préstamos' : 'No hay préstamos registrados'"
      row-key="id"
    >
      <template #actions="{ item }">
        <button @click="viewLoan(item.id)" class="action-button">Ver</button>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from 'iconoir-vue/regular'
import { loansApi, type Loan } from '@/api/loans.api'
import { useSearchableList } from '@/shared/composables/useSearchableList'
import DataTable from '@/shared/components/DataTable.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'

const router = useRouter()
const loans = ref<Loan[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Búsqueda contextual
const loansRef = computed(() => loans.value)
const { searchQuery, filteredItems } = useSearchableList<Loan>(loansRef, [
  'loan_type',
  'status',
  'member_id'
])

const columns = [
  { key: 'member_id', label: 'Miembro' },
  { key: 'loan_type', label: 'Tipo' },
  { key: 'approved_amount', label: 'Monto Aprobado', format: 'currency' },
  { key: 'outstanding_balance', label: 'Saldo Pendiente', format: 'currency' },
  { key: 'status', label: 'Estado' }
]

onMounted(async () => {
  loading.value = true
  try {
    loans.value = await loansApi.getLoans()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar préstamos'
  } finally {
    loading.value = false
  }
})

function viewLoan(id: string) {
  router.push(`/loans/${id}`)
}
</script>

<style scoped>
.loans-view {
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
