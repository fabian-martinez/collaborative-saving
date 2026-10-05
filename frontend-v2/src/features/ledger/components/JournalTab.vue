<template>
  <div class="space-y-4">
    <!-- Filtros -->
    <div class="flex flex-col md:flex-row gap-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar por concepto..."
        class="input input-bordered flex-1"
      />
      <select v-model="selectedAccount" class="select select-bordered">
        <option value="">Todas las cuentas</option>
        <option
          v-for="account in accountTypes"
          :key="account.value"
          :value="account.value"
        >
          {{ account.label }}
        </option>
      </select>
    </div>

    <LoadingSpinner :loading="loading" />
    <ErrorMessage :error="error" />

    <!-- Tabla de Asientos -->
    <div v-if="!loading && !error" class="overflow-x-auto">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>#</th>
            <th>FECHA</th>
            <th>CUENTA</th>
            <th>CONCEPTO</th>
            <th>DEBE</th>
            <th>HABER</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(group, groupIndex) in groupedEntries" :key="groupIndex">
            <tr
              v-for="(entry, entryIndex) in group.entries"
              :key="entry.id"
              :class="{ 'bg-base-200': entryIndex === 0 }"
            >
              <td v-if="entryIndex === 0" :rowspan="group.entries.length">
                {{ group.entryNumber }}
              </td>
              <td v-if="entryIndex === 0" :rowspan="group.entries.length">
                {{ formatDate(entry.created_at) }}
              </td>
              <td>
                {{ getAccountLabel(entry.account_type) }}
              </td>
              <td>
                <div>{{ group.concept }}</div>
                <div class="text-xs text-base-content/50">Ref: {{ group.reference }}</div>
              </td>
              <td>
                <span v-if="entry.amount > 0" class="font-semibold">
                  {{ formatCurrency(entry.amount) }}
                </span>
              </td>
              <td>
                <span v-if="entry.amount < 0" class="font-semibold">
                  {{ formatCurrency(Math.abs(entry.amount)) }}
                </span>
              </td>
            </tr>
          </template>
          <tr v-if="groupedEntries.length === 0">
            <td colspan="6" class="text-center py-8 text-base-content/60">
              No se encontraron asientos contables
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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
import { ref, computed, onMounted, watch } from 'vue'
import { ledgerApi, type LedgerEntry } from '@/api/ledger.api'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { ACCOUNT_TYPE_LABELS, type AccountType } from '../constants/account-types'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import Pagination from '@/shared/components/Pagination.vue'
import { useToast } from '@/shared/composables/useToast'

const toast = useToast()
const loading = ref(false)
const error = ref<string | null>(null)
const entries = ref<{ data: LedgerEntry[]; page: number; limit: number; total: number }>({
  data: [],
  page: 1,
  limit: 20,
  total: 0
})
const page = ref(1)
const limit = ref(20)
const searchQuery = ref('')
const selectedAccount = ref('')
const accountTypes = ref<Array<{ value: string; label: string }>>([])

const totalPages = computed(() => Math.ceil(entries.value.total / limit.value))

// Agrupar entradas por operación
const groupedEntries = computed(() => {
  const groups = new Map<string, {
    operationId: string
    entryNumber: number
    concept: string
    reference: string
    entries: LedgerEntry[]
  }>()

  let entryNumber = entries.value.total - ((page.value - 1) * limit.value)

  entries.value.data.forEach(entry => {
    if (!groups.has(entry.operation_id)) {
      const operationType = entry.operation_type || ''
      const typePrefix: Record<string, string> = {
        MONTHLY_PAYMENT: 'APO',
        LOAN_DISBURSEMENT: 'PRE',
        LOAN_PAYMENT: 'PAG',
        ASSET_REVALUATION: 'REV',
        INTEREST_ACCRUAL: 'INT',
        PROVISION: 'PRC'
      }
      const prefix = typePrefix[operationType] || 'OP'
      const date = entry.operation_date ? new Date(entry.operation_date) : new Date(entry.created_at)
      const year = date.getFullYear()
      const number = entry.operation_id.substring(0, 3).toUpperCase()
      const reference = `${prefix}-${year}-${number}`

      groups.set(entry.operation_id, {
        operationId: entry.operation_id,
        entryNumber: entryNumber--,
        concept: entry.operation_description || entry.description || 'Sin concepto',
        reference,
        entries: []
      })
    }
    
    groups.get(entry.operation_id)!.entries.push(entry)
  })

  return Array.from(groups.values())
})

const getAccountLabel = (accountType: string) => {
  return ACCOUNT_TYPE_LABELS[accountType as AccountType] || accountType
}

async function fetchEntries() {
  loading.value = true
  error.value = null
  try {
    entries.value = await ledgerApi.getLedgerEntries({
      page: page.value,
      limit: limit.value,
      account_type: selectedAccount.value || undefined,
      order_by: 'DESC'
    })
    
    // Filtrar por búsqueda en el frontend si hay searchQuery
    if (searchQuery.value) {
      const searchLower = searchQuery.value.toLowerCase()
      entries.value.data = entries.value.data.filter(entry => 
        (entry.operation_description || entry.description || '').toLowerCase().includes(searchLower) ||
        entry.account_type.toLowerCase().includes(searchLower)
      )
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar asientos contables'
  } finally {
    loading.value = false
  }
}

async function fetchAccountTypes() {
  try {
    accountTypes.value = await ledgerApi.getAccountTypes()
  } catch (e) {
    console.error('Error al cargar tipos de cuenta:', e)
  }
}

function handlePageChange(newPage: number) {
  page.value = newPage
  fetchEntries()
}

watch([selectedAccount], () => {
  page.value = 1
  fetchEntries()
})

watch([searchQuery], () => {
  // Solo filtrar en el frontend, no hacer nueva petición
  fetchEntries()
})

onMounted(() => {
  fetchEntries()
  fetchAccountTypes()
})

// Función de exportación
async function exportData() {
  try {
    // Obtener todas las entradas sin paginación para exportar
    const allEntries = await ledgerApi.getLedgerEntries({
      limit: 10000,
      account_type: selectedAccount.value || undefined,
      order_by: 'DESC'
    })

    // Filtrar por búsqueda si hay
    let filteredEntries = allEntries.data
    if (searchQuery.value) {
      const searchLower = searchQuery.value.toLowerCase()
      filteredEntries = filteredEntries.filter(entry => 
        (entry.operation_description || entry.description || '').toLowerCase().includes(searchLower) ||
        entry.account_type.toLowerCase().includes(searchLower)
      )
    }

    // Agrupar por operación y crear datos de exportación
    const exportData: Record<string, unknown>[] = []
    
    const groups = new Map<string, {
      operationId: string
      entryNumber: number
      concept: string
      reference: string
      entries: LedgerEntry[]
    }>()

    let entryNumber = filteredEntries.length

    filteredEntries.forEach(entry => {
      if (!groups.has(entry.operation_id)) {
        const operationType = entry.operation_type || ''
        const typePrefix: Record<string, string> = {
          MONTHLY_PAYMENT: 'APO',
          LOAN_DISBURSEMENT: 'PRE',
          LOAN_PAYMENT: 'PAG',
          ASSET_REVALUATION: 'REV',
          INTEREST_ACCRUAL: 'INT',
          PROVISION: 'PRC'
        }
        const prefix = typePrefix[operationType] || 'OP'
        const date = entry.operation_date ? new Date(entry.operation_date) : new Date(entry.created_at)
        const year = date.getFullYear()
        const number = entry.operation_id.substring(0, 3).toUpperCase()
        const reference = `${prefix}-${year}-${number}`

        groups.set(entry.operation_id, {
          operationId: entry.operation_id,
          entryNumber: entryNumber--,
          concept: entry.operation_description || entry.description || 'Sin concepto',
          reference,
          entries: []
        })
      }
      
      groups.get(entry.operation_id)!.entries.push(entry)
    })

    // Crear filas de exportación
    Array.from(groups.values()).forEach(group => {
      group.entries.forEach((entry, index) => {
        exportData.push({
          '#': index === 0 ? group.entryNumber : '',
          'Fecha': index === 0 ? formatDate(entry.created_at) : '',
          'Cuenta': getAccountLabel(entry.account_type),
          'Concepto': index === 0 ? group.concept : '',
          'Referencia': index === 0 ? group.reference : '',
          'Debe': entry.amount > 0 ? Math.abs(entry.amount) : '',
          'Haber': entry.amount < 0 ? Math.abs(entry.amount) : ''
        })
      })
    })

    const { exportToCSV } = await import('@/shared/utils/export')
    exportToCSV(exportData, `libro-diario-${new Date().toISOString().split('T')[0]}`)
    toast.success('Libro diario exportado exitosamente')
  } catch (e) {
    console.error('Error al exportar libro diario:', e)
    toast.error('Error al exportar libro diario')
  }
}

defineExpose({
  exportData
})
</script>

