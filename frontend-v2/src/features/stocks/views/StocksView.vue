<!--
  Copyright 2026 Collaborative Saving Project.
  All rights reserved.
-->
<template>
  <div class="stocks-view p-6 space-y-6">
    <!-- Header & Action Bar -->
    <div class="view-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Acciones</h1>
        <p class="text-sm text-base-content/70">
          Administración y configuración de las acciones del fondo colaborativo.
        </p>
      </div>
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <div class="relative flex-1 sm:w-64">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nombre o comportamiento..."
            aria-label="Buscar acciones"
            class="input input-bordered w-full pl-10 input-sm sm:input-md"
            data-testid="stock-search-input"
          />
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <button
          @click="openCreateModal"
          class="btn btn-primary btn-sm sm:btn-md"
          aria-label="Nueva Acción"
          data-testid="create-stock-btn"
        >
          <Plus class="w-4 h-4 mr-1" />
          Nueva Acción
        </button>
      </div>
    </div>

    <!-- Feedback States -->
    <LoadingSpinner :loading="stocksStore.loading" message="Cargando acciones..." />
    <ErrorMessage v-if="stocksStore.error && !stocksStore.loading" :error="stocksStore.error" />
    <div v-if="actionError" class="alert alert-error text-sm py-2" data-testid="stock-action-error">
      <span>{{ actionError }}</span>
      <button @click="actionError = null" class="btn btn-ghost btn-xs ml-auto">✕</button>
    </div>

    <!-- Data Table -->
    <div v-if="!stocksStore.loading && !stocksStore.error" class="card bg-base-100 shadow-sm border border-base-200">
      <DataTable
        :data="filteredItems"
        :columns="columns"
        :actions="true"
        :empty-message="searchQuery ? 'No se encontraron acciones' : 'No hay acciones registradas'"
        row-key="id"
      >
        <!-- Name Column -->
        <template #cell-name="{ item }">
          <span class="font-medium text-base-content">{{ item.name || item.type }}</span>
        </template>

        <!-- Stock Type Column -->
        <template #cell-stock_type="{ item }">
          <span v-if="getStockTypeName(item)" class="badge badge-outline text-xs">
            {{ getStockTypeName(item) }}
          </span>
          <span v-else class="text-xs text-base-content/40">-</span>
        </template>

        <!-- Guaranteed Column -->
        <template #cell-is_guaranteed="{ item }">
          <span v-if="item.is_guaranteed" class="badge badge-success badge-sm font-medium">
            Garantizada
          </span>
          <span v-else class="text-xs text-base-content/50">Variable</span>
        </template>

        <!-- Behavior Column -->
        <template #cell-behavior="{ item }">
          <span
            :class="[
              'badge badge-sm font-medium',
              item.behavior === 'DIVIDEND_YIELD' ? 'badge-secondary' : 'badge-ghost'
            ]"
          >
            {{ item.behavior === 'DIVIDEND_YIELD' ? 'Rendimiento / Dividendos' : 'Apreciación de Capital' }}
          </span>
        </template>

        <!-- Actions Column -->
        <template #actions="{ item }">
          <div class="flex justify-center gap-1">
            <button
              @click="viewStock(item.id)"
              class="btn btn-sm btn-ghost"
              title="Ver detalles"
              aria-label="Ver detalles"
              data-testid="view-stock-btn"
            >
              <Eye class="w-4 h-4" />
            </button>
            <button
              @click="openEditModal(item)"
              class="btn btn-sm btn-ghost text-primary"
              title="Editar acción"
              aria-label="Editar"
              data-testid="edit-stock-btn"
            >
              <EditPencil class="w-4 h-4" />
            </button>
            <button
              @click="confirmDelete(item)"
              class="btn btn-sm btn-ghost text-error"
              title="Eliminar acción"
              aria-label="Eliminar"
              data-testid="delete-stock-btn"
            >
              <Trash class="w-4 h-4" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Stock Form Modal (Create / Edit) -->
    <StockForm
      :show="showFormModal"
      :stock="selectedStock"
      @close="closeFormModal"
      @saved="handleStockSaved"
    />

    <!-- Delete Confirmation Modal -->
    <Modal :show="showDeleteModal" title="Confirmar Eliminación" @close="cancelDelete">
      <div class="p-2 space-y-4">
        <p>
          ¿Está seguro de que desea eliminar la acción <strong>{{ stockToDelete?.name || stockToDelete?.type }}</strong>?
        </p>
        <p class="text-sm text-base-content/70">
          Esta acción deshabilitará la acción. No se puede eliminar una acción que tenga suscripciones activas con cantidad mayor a 0.
        </p>
        <div v-if="deleteError" class="alert alert-error text-sm py-2">
          <span>{{ deleteError }}</span>
        </div>
        <div class="modal-action">
          <button type="button" @click="cancelDelete" class="btn btn-ghost" :disabled="isDeleting">
            Cancelar
          </button>
          <button
            type="button"
            @click="handleDelete"
            class="btn btn-error"
            :disabled="isDeleting"
            data-testid="confirm-delete-stock-btn"
          >
            <span v-if="isDeleting" class="loading loading-spinner loading-sm mr-1"></span>
            {{ isDeleting ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, Eye, EditPencil, Trash } from 'iconoir-vue/regular'
import { useStocksStore } from '../stores/stocks'
import { settingsApi, type StockType } from '@/api/settings.api'
import { type Stock } from '@/api/stocks.api'
import { useSearchableList } from '@/shared/composables/useSearchableList'
import DataTable, { type Column } from '@/shared/components/DataTable.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import Modal from '@/shared/components/Modal.vue'
import StockForm from '../components/StockForm.vue'

const router = useRouter()
const stocksStore = useStocksStore()

const stockTypes = ref<StockType[]>([])
const actionError = ref<string | null>(null)

// Modal states
const showFormModal = ref(false)
const selectedStock = ref<Stock | null>(null)

const showDeleteModal = ref(false)
const stockToDelete = ref<Stock | null>(null)
const isDeleting = ref(false)
const deleteError = ref<string | null>(null)

// Contextual search
const stocksRef = computed(() => stocksStore.stocks)
const { searchQuery, filteredItems } = useSearchableList<Stock>(stocksRef, [
  'name',
  'type',
  'behavior'
])

const columns: Column[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'stock_type', label: 'Tipo' },
  { key: 'value', label: 'Valor', format: 'currency' },
  { key: 'monthly_contribution', label: 'Aporte Mensual', format: 'currency' },
  { key: 'is_guaranteed', label: 'Garantizada' },
  { key: 'behavior', label: 'Comportamiento' }
]

function getStockTypeName(stock: Stock): string | null {
  if (stock.stock_type?.name) {
    return stock.stock_type.name
  }
  if (stock.stock_type_id && stockTypes.value.length > 0) {
    const found = stockTypes.value.find(st => st.id === stock.stock_type_id)
    if (found) return found.name
  }
  return null
}

onMounted(async () => {
  try {
    await Promise.all([
      stocksStore.fetchStocks(),
      settingsApi.getStockTypes().then(types => {
        stockTypes.value = types
      }).catch(() => {
        // Ignorar fallo secundario de stock types
      })
    ])
  } catch {
    // Error capturado en el store
  }
})

function viewStock(id: string) {
  router.push(`/stocks/${id}`)
}

function openCreateModal() {
  selectedStock.value = null
  showFormModal.value = true
}

function openEditModal(stock: Stock) {
  selectedStock.value = stock
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  selectedStock.value = null
}

function handleStockSaved() {
  actionError.value = null
  closeFormModal()
}

function confirmDelete(stock: Stock) {
  stockToDelete.value = stock
  deleteError.value = null
  showDeleteModal.value = true
}

function cancelDelete() {
  showDeleteModal.value = false
  stockToDelete.value = null
  deleteError.value = null
}

async function handleDelete() {
  if (!stockToDelete.value) return
  isDeleting.value = true
  deleteError.value = null
  try {
    await stocksStore.deleteStock(stockToDelete.value.id)
    cancelDelete()
  } catch (err: unknown) {
    deleteError.value = err instanceof Error ? err.message : 'Error al eliminar la acción'
  } finally {
    isDeleting.value = false
  }
}
</script>
