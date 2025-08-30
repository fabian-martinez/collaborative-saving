<template>
  <div class="container mx-auto pt-10 pb-6 space-y-6">

    <!-- Filtros del ledger -->
    <div class="bg-base-100 rounded-box p-4 border border-base-300">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Filtros del Ledger</h3>
        <div class="flex items-center gap-2">
          <div v-if="hasActiveFilters" class="badge badge-info">
            {{ activeFiltersCount }} filtros activos
          </div>
          <button 
            v-if="hasActiveFilters" 
            class="btn btn-ghost btn-sm" 
            @click="clearAllFilters"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>
      
      <LedgerFiltersComponent
        v-model="ledgerFilters"
        :member-options="memberOptions"
        :account-type-options="accountTypeOptions"
        :transaction-type-options="activeTab==='operations' ? operationTypeOptionsForOperations : operationTypeOptionsForEntries"
        :active-tab="activeTab"
      />
    </div>

    <div role="tablist" class="tabs tabs-lifted">
      <input type="radio" name="ledger-tabs" role="tab" class="tab" aria-label="Operations" :checked="activeTab==='operations'" @change="activeTab='operations'" />
      <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-4">
        <!-- Indicador de resultados -->
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="text-sm text-gray-600">
              Mostrando {{ Math.min((operationsPage - 1) * operationsLimit + 1, operationsTotal) }}–{{ Math.min(operationsPage * operationsLimit, operationsTotal) }} de {{ operationsTotal }} operaciones
            </div>
            <div v-if="hasActiveFilters" class="text-xs text-gray-500">
              Aplicando {{ activeFiltersCount }} filtros
            </div>
          </div>
        </div>
        
        <LedgerOperationsTable
          :operations="filteredOperations"
          :loading="loadingOperations"
          :error="errorOperations"
          @open-details="openOperationDetails"
        />
        <div class="mt-4 flex items-center justify-between">
          <div class="text-sm text-gray-500">Página {{ operationsPage }} de {{ Math.max(1, Math.ceil(operationsTotal / operationsLimit)) }}</div>
          <div class="join">
            <button class="btn join-item btn-sm" :disabled="operationsPage === 1 || loadingOperations" @click="changeOperationsPage(operationsPage - 1)">Prev</button>
            <button class="btn join-item btn-sm" :disabled="operationsPage >= Math.ceil(operationsTotal / operationsLimit) || loadingOperations" @click="changeOperationsPage(operationsPage + 1)">Next</button>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Page size:</span>
            <select class="select select-bordered select-sm" v-model.number="operationsLimit" @change="changeOperationsLimit" :disabled="loadingOperations">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <input type="radio" name="ledger-tabs" role="tab" class="tab" aria-label="Entries" :checked="activeTab==='entries'" @change="activeTab='entries'" />
      <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-4">
        <!-- Indicador de resultados -->
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="text-sm text-gray-600">
              Mostrando {{ Math.min((entriesPage - 1) * entriesLimit + 1, entriesTotal) }}–{{ Math.min(entriesPage * entriesLimit, entriesTotal) }} de {{ entriesTotal }} entradas
            </div>
            <div v-if="hasActiveFilters" class="text-xs text-gray-500">
              Aplicando {{ activeFiltersCount }} filtros
            </div>
          </div>
        </div>
        
        <LedgerEntriesTable
          :rows="filteredEntries"
          :loading="loadingEntries"
          :error="errorEntries"
          @update:selected="onSelectedEntries"
        />
        <div class="mt-4 flex items-center justify-between">
          <div class="text-sm text-gray-500">Página {{ entriesPage }} de {{ Math.max(1, Math.ceil(entriesTotal / entriesLimit)) }}</div>
          <div class="join">
            <button class="btn join-item btn-sm" :disabled="entriesPage === 1 || loadingEntries" @click="changeEntriesPage(entriesPage - 1)">Prev</button>
            <button class="btn join-item btn-sm" :disabled="entriesPage >= Math.ceil(entriesTotal / entriesLimit) || loadingEntries" @click="changeEntriesPage(entriesPage + 1)">Next</button>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Page size:</span>
            <select class="select select-bordered select-sm" v-model.number="entriesLimit" @change="changeEntriesLimit" :disabled="loadingEntries">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
        </div>
        <div class="mt-3 text-sm text-gray-600">Selected total: <span class="font-semibold">{{ formatCOP(selectedEntriesTotal) }}</span></div>
      </div>
    </div>

    <LedgerOperationDetailsModal
      :open="detailsOpen"
      :operation-id="selectedOperationId"
      @close="detailsOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import LedgerFiltersComponent from '@/features/ledger/components/LedgerFilters.vue'
import LedgerOperationsTable from '@/features/ledger/components/LedgerOperationsTable.vue'
import LedgerEntriesTable from '@/features/ledger/components/LedgerEntriesTable.vue'
import LedgerOperationDetailsModal from '@/features/ledger/components/LedgerOperationDetailsModal.vue'
import type { MemberOption, MeetingOption, EntryRow, OperationView, LedgerFilters } from '@/features/ledger/types'
import { getMembers, getMeetings, getAccountTypeOptions, listOperations, listEntries, getOperationTypes } from '@/features/ledger/services/ledgerService'

const activeTab = ref<'operations' | 'entries'>('operations')

const operations = ref<OperationView[]>([])
const operationsPage = ref(1)
const operationsLimit = ref(20)
const operationsTotal = ref(0)

const entryRows = ref<EntryRow[]>([])
const entriesPage = ref(1)
const entriesLimit = ref(20)
const entriesTotal = ref(0)
const loadingOperations = ref(false)
const loadingEntries = ref(false)
const errorOperations = ref<string | null>(null)
const errorEntries = ref<string | null>(null)
const memberOptions = ref<MemberOption[]>([])
const meetingOptions = ref<MeetingOption[]>([])
const accountTypeOptions = ref<{ value: string; label: string }[]>([])
const selectedEntryIds = ref<string[]>([])
const detailsOpen = ref(false)
const selectedOperationId = ref<string | null>(null)

// Filtros del ledger
const ledgerFilters = ref<LedgerFilters>({
  memberId: undefined,
  accountType: undefined,
  meetingId: undefined,
  search: undefined,
  operationType: undefined
})

// Detectar filtros activos
const hasActiveFilters = computed(() => {
  return !!(
    ledgerFilters.value.memberId ||
    ledgerFilters.value.accountType ||
    ledgerFilters.value.meetingId ||
    ledgerFilters.value.operationType
  )
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (ledgerFilters.value.memberId) count++
  if (ledgerFilters.value.accountType) count++
  if (ledgerFilters.value.meetingId) count++
  if (ledgerFilters.value.operationType) count++
  return count
})

// Datos ya vienen filtrados desde el backend
const filteredOperations = computed(() => operations.value)
const filteredEntries = computed(() => entryRows.value)

async function loadOperations() {
  loadingOperations.value = true
  errorOperations.value = null
  try {
    const [opsPage, types] = await Promise.all([
      listOperations({ page: operationsPage.value, limit: operationsLimit.value }),
      getOperationTypes()
    ])
    operations.value = opsPage.data
    operationsTotal.value = opsPage.total
    operationTypes.value = types
  } catch (e: unknown) {
    errorOperations.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    loadingOperations.value = false
  }
}

async function loadEntries() {
  loadingEntries.value = true
  errorEntries.value = null
  try {
    const page = await listEntries({ page: entriesPage.value, limit: entriesLimit.value })
    entryRows.value = page.data
    entriesTotal.value = page.total
  } catch (e: unknown) {
    errorEntries.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    loadingEntries.value = false
  }
}

async function loadFiltersData() {
  const [members, meetings, accountTypes] = await Promise.all([
    getMembers(), 
    getMeetings(), 
    getAccountTypeOptions()
  ])
  memberOptions.value = members
  meetingOptions.value = meetings
  accountTypeOptions.value = accountTypes
}

// Watch para reaccionar a cambios en los filtros
watch(ledgerFilters, async (newFilters) => {
  console.log('Filters changed, reloading data with filters:', newFilters)
  
  // Solo recargar si hay filtros activos
  if (hasActiveFilters.value) {
    await Promise.all([
      loadOperationsWithFilters(newFilters),
      loadEntriesWithFilters(newFilters)
    ])
  } else {
    // Si no hay filtros, cargar todos los datos
    await Promise.all([loadOperations(), loadEntries()])
  }
}, { deep: true })

onMounted(async () => {
  await Promise.all([loadFiltersData(), loadOperations(), loadEntries()])
})

watch(activeTab, (tab) => {
  // Al cambiar de pestaña, limpiar el filtro que no aplica
  if (tab === 'operations' && ledgerFilters.value.accountType) {
    ledgerFilters.value.accountType = undefined
  }
  if (tab === 'entries' && ledgerFilters.value.operationType) {
    ledgerFilters.value.operationType = undefined
  }
})

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
}

const operationTypes = ref<string[]>([])
const operationTypeOptionsForOperations = computed(() => {
  const set = new Set(operations.value.map(o => o.type).filter(Boolean))
  return Array.from(set).sort().map(v => ({ value: v, label: v }))
})

const operationTypeOptionsForEntries = computed(() => {
  const set = new Set(entryRows.value.map(e => e.operationType).filter(Boolean))
  return Array.from(set).sort().map(v => ({ value: v, label: v }))
})

function onSelectedEntries(ids: string[]) {
  selectedEntryIds.value = ids
}

const selectedEntriesTotal = computed(() => {
  const set = new Set(selectedEntryIds.value)
  return filteredEntries.value.filter(r => set.has(r.id)).reduce((s, r) => s + r.amount, 0)
})

function openOperationDetails(id: string) {
  selectedOperationId.value = id
  detailsOpen.value = true
}

function clearAllFilters() {
  ledgerFilters.value = {
    memberId: undefined,
    accountType: undefined,
    meetingId: undefined,
    search: undefined,
    operationType: undefined
  }
  console.log('All filters cleared, reloading all data')
  
  // Recargar todos los datos cuando se limpien los filtros
  Promise.all([loadOperations(), loadEntries()])
}

async function loadOperationsWithFilters(filters: LedgerFilters) {
  loadingOperations.value = true
  errorOperations.value = null
  try {
    const [opsPage, types] = await Promise.all([
      listOperations({ ...filters, page: operationsPage.value, limit: operationsLimit.value }),
      getOperationTypes()
    ])
    operations.value = opsPage.data
    operationsTotal.value = opsPage.total
    operationTypes.value = types
  } catch (e: unknown) {
    errorOperations.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    loadingOperations.value = false
  }
}

async function loadEntriesWithFilters(filters: LedgerFilters) {
  loadingEntries.value = true
  errorEntries.value = null
  try {
    const page = await listEntries({ ...filters, page: entriesPage.value, limit: entriesLimit.value })
    entryRows.value = page.data
    entriesTotal.value = page.total
  } catch (e: unknown) {
    errorEntries.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    loadingEntries.value = false
  }
}

function changeOperationsPage(p: number) {
  operationsPage.value = p
  if (hasActiveFilters.value) {
    loadOperationsWithFilters(ledgerFilters.value)
  } else {
    loadOperations()
  }
}

function changeOperationsLimit() {
  operationsPage.value = 1
  if (hasActiveFilters.value) {
    loadOperationsWithFilters(ledgerFilters.value)
  } else {
    loadOperations()
  }
}

function changeEntriesPage(p: number) {
  entriesPage.value = p
  if (hasActiveFilters.value) {
    loadEntriesWithFilters(ledgerFilters.value)
  } else {
    loadEntries()
  }
}

function changeEntriesLimit() {
  entriesPage.value = 1
  if (hasActiveFilters.value) {
    loadEntriesWithFilters(ledgerFilters.value)
  } else {
    loadEntries()
  }
}
</script>

<style scoped>
</style>


