<template>
  <div class="loans-view">
    <h1>Préstamos</h1>
    <LoadingSpinner :loading="loading" />
    <ErrorMessage :error="error" />
    <DataTable
      v-if="!loading && !error"
      :data="loans"
      :columns="columns"
      :actions="true"
      empty-message="No hay préstamos registrados"
      row-key="id"
    >
      <template #actions="{ item }">
        <button @click="viewLoan(item.id)" class="action-button">Ver</button>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { loansApi, type Loan } from '@/api/loans.api'
import DataTable from '@/shared/components/DataTable.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'

const router = useRouter()
const loans = ref<Loan[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

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

.action-button {
  padding: 0.25rem 0.5rem;
  background-color: #3498db;
  color: white;
}
</style>

