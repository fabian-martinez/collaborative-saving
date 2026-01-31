<template>
  <div class="stocks-view p-8">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="m-0 text-3xl font-bold text-base-content">Acciones</h1>
        <p class="text-base-content/60 mt-1">Gestiona los tipos de acciones y sus rendimientos</p>
      </div>
      <div class="flex items-center gap-4">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar acciones..."
            class="input input-bordered w-64 pl-10 focus:input-primary transition-all"
          />
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
        </div>
        <button @click="showCreateModal = true" class="btn btn-primary gap-2">
          <Plus class="w-5 h-5" />
          Nueva Acción
        </button>
      </div>
    </div>

    <LoadingSpinner :loading="store.loading" message="Cargando acciones..." />
    <ErrorMessage :error="store.error" />

    <div v-if="!store.loading && !store.error" class="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
      <DataTable
        :data="filteredItems"
        :columns="columns"
        :actions="true"
        :empty-message="searchQuery ? 'No se encontraron acciones' : 'No hay acciones registradas'"
        row-key="id"
      >
        <!-- Yield Slot -->
        <template #cell-is_guaranteed="{ item }">
          <div class="flex items-center gap-2">
            <span 
              v-if="item.is_guaranteed" 
              class="badge badge-success badge-sm gap-1 pl-1"
            >
              <CheckCircle class="w-3 h-3" />
              Garantizado ({{ ((item.guaranteed_yield || 0) * 100).toFixed(1) }}%)
            </span>
            <span v-else class="badge badge-ghost badge-sm">Variable</span>
          </div>
        </template>

        <!-- Actions Slot -->
        <template #actions="{ item }">
          <div class="flex gap-1 justify-end">
            <button 
              @click="viewStock(item.id)" 
              class="btn btn-sm btn-ghost btn-square" 
              title="Ver detalles"
            >
              <Eye class="w-4 h-4 text-base-content/70" />
            </button>
            <button 
              @click="editStock(item)" 
              class="btn btn-sm btn-ghost btn-square" 
              title="Editar"
            >
              <EditPencil class="w-4 h-4 text-base-content/70" />
            </button>
            <button 
              @click="confirmDelete(item)" 
              class="btn btn-sm btn-ghost btn-square text-error" 
              title="Eliminar"
            >
              <Trash class="w-4 h-4" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Create Modal -->
    <Modal :show="showCreateModal" title="Nueva Acción" @close="showCreateModal = false">
      <div class="p-1">
        <StockForm @submit="handleCreate" @cancel="showCreateModal = false" />
      </div>
    </Modal>

    <!-- Edit Modal -->
    <Modal :show="showEditModal" title="Editar Acción" @close="showEditModal = false">
      <div class="p-1">
        <StockForm
          v-if="stockToEdit"
          :initial-data="stockToEdit"
          @submit="handleEdit"
          @cancel="showEditModal = false"
        />
      </div>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal :show="showDeleteModal" title="Confirmar Eliminación" @close="cancelDelete">
      <div class="p-4">
        <div class="flex items-center gap-4 text-error mb-4">
          <WarningTriangle class="w-12 h-12" />
          <div>
            <h3 class="font-bold text-lg">¿Estás seguro?</h3>
            <p class="text-base-content/70">Vas a eliminar la acción <strong>{{ stockToDelete?.name }}</strong>.</p>
          </div>
        </div>
        <div class="bg-base-200 p-4 rounded-lg mb-6 text-sm">
          <p>Esta acción es irreversible y podría afectar los registros históricos de aportes si hay transacciones vinculadas.</p>
        </div>
        <div class="flex justify-end gap-3">
          <button @click="cancelDelete" class="btn btn-ghost">Cancelar</button>
          <button @click="handleDelete" class="btn btn-error" :disabled="isDeleting">
            <span v-if="isDeleting" class="loading loading-spinner loading-xs"></span>
            Eliminar Acción
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, Eye, EditPencil, Trash, CheckCircle, WarningTriangle } from 'iconoir-vue/regular'
import { useStocksStore } from '../stores/stocks'
import { useSearchableList } from '@/shared/composables/useSearchableList'
import DataTable, { type Column } from '@/shared/components/DataTable.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import Modal from '@/shared/components/Modal.vue'
import StockForm from '../components/StockForm.vue'
import type { Stock, CreateStockRequest } from '@/api/stocks.api'

const router = useRouter()
const store = useStocksStore()

// State
const showCreateModal = ref(false)
const showEditModal = ref(false)
const stockToEdit = ref<Stock | null>(null)
const showDeleteModal = ref(false)
const stockToDelete = ref<Stock | null>(null)
const isDeleting = ref(false)

// Búsqueda contextual
const stocksRef = computed(() => store.stocks)
const { searchQuery, filteredItems } = useSearchableList<Stock>(stocksRef, [
  'name',
  'behavior'
])

const columns: Column[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'value', label: 'Valor Unitario', format: 'currency' },
  { key: 'monthly_contribution', label: 'Aporte Mensual', format: 'currency' },
  { key: 'is_guaranteed', label: 'Rendimiento' }
]

onMounted(() => {
  store.fetchStocks()
})

// Methods
function viewStock(id: string) {
  router.push(`/stocks/${id}`)
}

function editStock(stock: Stock) {
  stockToEdit.value = stock
  showEditModal.value = true
}

async function handleCreate(data: CreateStockRequest) {
  try {
    await store.createStock(data)
    showCreateModal.value = false
  } catch (e) {
    // Error managed by store
  }
}

async function handleEdit(data: CreateStockRequest) {
  if (!stockToEdit.value) return
  try {
    await store.updateStock(stockToEdit.value.id, data)
    showEditModal.value = false
    stockToEdit.value = null
  } catch (e) {
    // Error managed by store
  }
}

function confirmDelete(stock: Stock) {
  stockToDelete.value = stock
  showDeleteModal.value = true
}

function cancelDelete() {
  showDeleteModal.value = false
  stockToDelete.value = null
}

async function handleDelete() {
  if (!stockToDelete.value) return
  isDeleting.value = true
  try {
    await store.deleteStock(stockToDelete.value.id)
    showDeleteModal.value = false
    stockToDelete.value = null
  } catch (e) {
    // Error managed by store
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
/* No styles needed with Tailwind and DaisyUI */
</style>

