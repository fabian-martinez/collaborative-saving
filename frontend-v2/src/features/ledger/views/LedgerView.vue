<template>
  <div class="ledger-view">
    <h1>Libro Contable</h1>
    <LoadingSpinner :loading="loading" />
    <ErrorMessage :error="error" />
    <DataTable
      v-if="!loading && !error"
      :data="entries.data"
      :columns="columns"
      empty-message="No hay asientos contables"
    />
    <Pagination
      v-if="entries.total > 0"
      :page="page"
      :total-pages="totalPages"
      :total="entries.total"
      :start-index="(page - 1) * limit + 1"
      :end-index="Math.min(page * limit, entries.total)"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ledgerApi, type LedgerEntry } from '@/api/ledger.api'
import DataTable from '@/shared/components/DataTable.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import Pagination from '@/shared/components/Pagination.vue'

const entries = ref<{ data: LedgerEntry[]; page: number; limit: number; total: number }>({
  data: [],
  page: 1,
  limit: 20,
  total: 0
})
const loading = ref(false)
const error = ref<string | null>(null)
const page = ref(1)
const limit = ref(20)

const totalPages = computed(() => Math.ceil(entries.value.total / limit.value))

const columns = [
  { key: 'created_at', label: 'Fecha', format: 'datetime' },
  { key: 'account_type', label: 'Tipo de Cuenta' },
  { key: 'amount', label: 'Monto', format: 'currency' },
  { key: 'description', label: 'Descripción' },
  { key: 'member_name', label: 'Miembro' }
]

async function fetchEntries() {
  loading.value = true
  error.value = null
  try {
    entries.value = await ledgerApi.getLedgerEntries({
      page: page.value,
      limit: limit.value
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar asientos contables'
  } finally {
    loading.value = false
  }
}

function handlePageChange(newPage: number) {
  page.value = newPage
  fetchEntries()
}

onMounted(() => {
  fetchEntries()
})
</script>

<style scoped>
.ledger-view {
  padding: 2rem;
}
</style>

