<template>
  <div class="container mx-auto p-4 md:p-6 max-w-7xl">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <h1 class="text-2xl font-bold text-base-content">Préstamos</h1>
      <div class="relative w-full md:w-auto">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por tipo o estado..."
          class="input input-bordered w-full md:w-80 pl-10 bg-base-100"
        />
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/50" />
      </div>
    </div>
    
    <div class="card bg-base-100 shadow-sm border border-base-200">
      <div class="card-body p-0 overflow-hidden">
        <LoadingSpinner :loading="loading" class="p-8" />
        <ErrorMessage :error="error" class="m-4" />
        
        <DataTable
          v-if="!loading && !error"
          :data="filteredItems"
          :columns="columns"
          :actions="true"
          :empty-message="searchQuery ? 'No se encontraron préstamos' : 'No hay préstamos registrados'"
          row-key="id"
        >
          <template #actions="{ item }">
            <button @click="viewLoan(item.id)" class="btn btn-primary btn-sm">Ver Detalle</button>
          </template>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from 'iconoir-vue/regular'
import { loansApi, type Loan } from '@/api/loans.api'
import { useSearchableList } from '@/shared/composables/useSearchableList'
import DataTable, { type Column } from '@/shared/components/DataTable.vue'
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

const columns: Column[] = [
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
