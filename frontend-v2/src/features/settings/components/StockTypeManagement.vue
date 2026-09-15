<!--
  Copyright 2026 Collaborative Saving Project.
  All rights reserved.
-->
<template>
  <div class="stock-type-management space-y-6">
    <!-- Action Bar -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-xl font-bold">Tipos de Acciones</h2>
        <p class="text-sm text-base-content/70">
          Configura las modalidades de acción, rendimientos garantizados y esquemas de valorización.
        </p>
      </div>
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <div class="relative flex-1 sm:w-64">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar tipo de acción..."
            aria-label="Buscar tipos de acción"
            class="input input-bordered w-full pl-10 input-sm sm:input-md"
          />
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <button
          @click="openCreateModal"
          class="btn btn-primary btn-sm sm:btn-md"
          aria-label="Crear nuevo tipo de acción"
        >
          <Plus class="w-4 h-4 mr-1" />
          Nuevo Tipo
        </button>
      </div>
    </div>

    <!-- Loading and Error States -->
    <LoadingSpinner :loading="loading" message="Cargando tipos de acciones..." />
    <ErrorMessage v-if="error && !loading" :error="error" />

    <!-- Table -->
    <div v-if="!loading && !error" class="card bg-base-100 shadow-sm border border-base-200">
      <DataTable
        :data="filteredStockTypes"
        :columns="columns"
        :actions="true"
        :empty-message="searchQuery ? 'No se encontraron tipos de acción para la búsqueda' : 'No hay tipos de acción configurados'"
        row-key="id"
      >
        <!-- Code Column -->
        <template #cell-code="{ item }">
          <span class="badge badge-outline font-mono text-xs">{{ item.code }}</span>
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

        <!-- Guaranteed Column -->
        <template #cell-is_guaranteed="{ item }">
          <span
            v-if="item.is_guaranteed"
            class="badge badge-success badge-sm gap-1 font-medium"
          >
            Garantizada
          </span>
          <span v-else class="text-xs text-base-content/50">Variable</span>
        </template>

        <!-- Guaranteed Yield Column -->
        <template #cell-guaranteed_yield="{ item }">
          <span v-if="item.is_guaranteed && item.guaranteed_yield !== null && item.guaranteed_yield !== undefined" class="font-semibold text-primary">
            {{ (item.guaranteed_yield * 100).toFixed(2) }}% mensual
          </span>
          <span v-else class="text-base-content/40">-</span>
        </template>

        <!-- Description Column -->
        <template #cell-description="{ item }">
          <span class="text-sm text-base-content/70">{{ item.description || '-' }}</span>
        </template>

        <!-- Actions Column -->
        <template #actions="{ item }">
          <div class="flex justify-center gap-1">
            <button
              @click="openEditModal(item)"
              class="btn btn-sm btn-ghost text-primary"
              title="Editar tipo de acción"
              aria-label="Editar"
            >
              <EditPencil class="w-4 h-4" />
            </button>
            <button
              @click="confirmDelete(item)"
              class="btn btn-sm btn-ghost text-error"
              title="Eliminar tipo de acción"
              aria-label="Eliminar"
            >
              <Trash class="w-4 h-4" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Modal Crear -->
    <Modal :show="showCreateModal" title="Nuevo Tipo de Acción" @close="closeCreateModal">
      <form data-testid="create-stock-type-form" @submit.prevent="handleCreate" class="space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Nombre <span class="text-error">*</span></span>
          </label>
          <input
            v-model.trim="createForm.name"
            type="text"
            placeholder="ej. Acción Preferencial"
            required
            class="input input-bordered w-full"
            data-testid="stock-type-name-input"
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Código / Slug (Opcional)</span>
          </label>
          <input
            v-model.trim="createForm.code"
            type="text"
            placeholder="ej. preferencial (se autogenera si se deja vacío)"
            class="input input-bordered w-full font-mono text-sm"
            data-testid="stock-type-code-input"
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Comportamiento Financiero <span class="text-error">*</span></span>
          </label>
          <select
            v-model="createForm.behavior"
            class="select select-bordered w-full"
            data-testid="stock-type-behavior-select"
          >
            <option value="CAPITAL_APPRECIATION">Apreciación de Capital</option>
            <option value="DIVIDEND_YIELD">Rendimiento / Dividendos</option>
          </select>
          <label class="label">
            <span class="label-text-alt text-base-content/60">
              Define si el retorno se genera por revalorización global de activos o por pagos de rendimiento fijo.
            </span>
          </label>
        </div>

        <!-- Toggle Garantizada -->
        <div class="form-control bg-base-200/50 p-3 rounded-lg border border-base-200">
          <label class="cursor-pointer label">
            <div>
              <span class="label-text font-medium">Rendimiento Garantizado</span>
              <p class="text-xs text-base-content/60">Indica si esta acción pacta un porcentaje de rentabilidad fija.</p>
            </div>
            <input
              type="checkbox"
              v-model="createForm.is_guaranteed"
              class="checkbox checkbox-primary"
              data-testid="stock-type-guaranteed-checkbox"
            />
          </label>
        </div>

        <!-- Rendimiento porcentual condicional -->
        <div v-if="createForm.is_guaranteed" class="form-control">
          <label class="label">
            <span class="label-text font-medium">Rendimiento Mensual Garantizado (%) <span class="text-error">*</span></span>
          </label>
          <div class="relative">
            <input
              v-model.number="createForm.yieldPercent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="ej. 2.0"
              required
              class="input input-bordered w-full pr-8"
              data-testid="stock-type-yield-input"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 font-semibold text-gray-500">%</span>
          </div>
          <label class="label">
            <span class="label-text-alt text-base-content/60">
              Valor en porcentaje (ej. 2.0 para 2.0% mensual).
            </span>
          </label>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Descripción</span>
          </label>
          <textarea
            v-model.trim="createForm.description"
            placeholder="Detalles sobre este tipo de acción o condiciones particulares..."
            rows="2"
            class="textarea textarea-bordered w-full"
            data-testid="stock-type-description-input"
          ></textarea>
        </div>

        <div class="modal-action">
          <button type="button" @click="closeCreateModal" class="btn btn-ghost">
            Cancelar
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="submitting"
            data-testid="save-stock-type-btn"
          >
            <span v-if="submitting" class="loading loading-spinner loading-sm mr-1"></span>
            Crear Tipo de Acción
          </button>
        </div>
      </form>
    </Modal>

    <!-- Modal Editar -->
    <Modal :show="showEditModal" title="Editar Tipo de Acción" @close="closeEditModal">
      <form data-testid="edit-stock-type-form" @submit.prevent="handleUpdate" class="space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Código (No modificable)</span>
          </label>
          <input
            :value="editingItem?.code"
            disabled
            class="input input-bordered w-full font-mono text-sm bg-base-200"
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Nombre <span class="text-error">*</span></span>
          </label>
          <input
            v-model.trim="editForm.name"
            type="text"
            required
            class="input input-bordered w-full"
            data-testid="edit-stock-type-name-input"
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Comportamiento Financiero <span class="text-error">*</span></span>
          </label>
          <select
            v-model="editForm.behavior"
            class="select select-bordered w-full"
            data-testid="edit-stock-type-behavior-select"
          >
            <option value="CAPITAL_APPRECIATION">Apreciación de Capital</option>
            <option value="DIVIDEND_YIELD">Rendimiento / Dividendos</option>
          </select>
        </div>

        <!-- Toggle Garantizada en Edición -->
        <div class="form-control bg-base-200/50 p-3 rounded-lg border border-base-200">
          <label class="cursor-pointer label">
            <div>
              <span class="label-text font-medium">Rendimiento Garantizado</span>
              <p class="text-xs text-base-content/60">Indica si esta acción pacta un porcentaje de rentabilidad fija.</p>
            </div>
            <input
              type="checkbox"
              v-model="editForm.is_guaranteed"
              class="checkbox checkbox-primary"
              data-testid="edit-stock-type-guaranteed-checkbox"
            />
          </label>
        </div>

        <!-- Rendimiento porcentual condicional en Edición -->
        <div v-if="editForm.is_guaranteed" class="form-control">
          <label class="label">
            <span class="label-text font-medium">Rendimiento Mensual Garantizado (%) <span class="text-error">*</span></span>
          </label>
          <div class="relative">
            <input
              v-model.number="editForm.yieldPercent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="ej. 2.0"
              required
              class="input input-bordered w-full pr-8"
              data-testid="edit-stock-type-yield-input"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 font-semibold text-gray-500">%</span>
          </div>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Descripción</span>
          </label>
          <textarea
            v-model.trim="editForm.description"
            rows="2"
            class="textarea textarea-bordered w-full"
            data-testid="edit-stock-type-description-input"
          ></textarea>
        </div>

        <div class="modal-action">
          <button type="button" @click="closeEditModal" class="btn btn-ghost">
            Cancelar
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="submitting"
            data-testid="update-stock-type-btn"
          >
            <span v-if="submitting" class="loading loading-spinner loading-sm mr-1"></span>
            Actualizar
          </button>
        </div>
      </form>
    </Modal>

    <!-- Modal Eliminar -->
    <Modal :show="showDeleteModal" title="Eliminar Tipo de Acción" @close="closeDeleteModal">
      <div class="space-y-4">
        <p>
          ¿Estás seguro de que deseas eliminar el tipo de acción
          <span class="font-bold">{{ deletingItem?.name }}</span>
          (<span class="font-mono text-sm">{{ deletingItem?.code }}</span>)?
        </p>
        <div class="alert alert-warning text-xs">
          <WarningTriangle class="w-4 h-4 flex-shrink-0" />
          <span>
            No es posible eliminar un tipo de acción si existen acciones activas asociadas en el fondo.
          </span>
        </div>

        <div class="modal-action">
          <button type="button" @click="closeDeleteModal" class="btn btn-ghost">
            Cancelar
          </button>
          <button
            type="button"
            @click="handleDelete"
            class="btn btn-error"
            :disabled="submitting"
            data-testid="confirm-delete-stock-type-btn"
          >
            <span v-if="submitting" class="loading loading-spinner loading-sm mr-1"></span>
            Eliminar
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Search, EditPencil, Trash, WarningTriangle } from 'iconoir-vue/regular'
import DataTable, { type Column } from '@/shared/components/DataTable.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import Modal from '@/shared/components/Modal.vue'
import { useToast } from '@/shared/composables/useToast'
import { settingsApi, type StockType, type StockBehavior } from '@/api/settings.api'

const toast = useToast()

// Data state
const stockTypes = ref<StockType[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const submitting = ref(false)

// Columns configuration
const columns: Column[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'code', label: 'Código' },
  { key: 'behavior', label: 'Comportamiento' },
  { key: 'is_guaranteed', label: 'Garantía' },
  { key: 'guaranteed_yield', label: 'Rendimiento' },
  { key: 'description', label: 'Descripción' }
]

// Filtered items
const filteredStockTypes = computed(() => {
  if (!searchQuery.value.trim()) return stockTypes.value
  const q = searchQuery.value.toLowerCase()
  return stockTypes.value.filter(
    (st) =>
      st.name.toLowerCase().includes(q) ||
      st.code.toLowerCase().includes(q) ||
      (st.description && st.description.toLowerCase().includes(q))
  )
})

// Create Modal State
const showCreateModal = ref(false)
const createForm = ref({
  name: '',
  code: '',
  behavior: 'CAPITAL_APPRECIATION' as StockBehavior,
  is_guaranteed: false,
  yieldPercent: 2.0,
  description: ''
})

function openCreateModal() {
  createForm.value = {
    name: '',
    code: '',
    behavior: 'CAPITAL_APPRECIATION',
    is_guaranteed: false,
    yieldPercent: 2.0,
    description: ''
  }
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

// Edit Modal State
const showEditModal = ref(false)
const editingItem = ref<StockType | null>(null)
const editForm = ref({
  name: '',
  behavior: 'CAPITAL_APPRECIATION' as StockBehavior,
  is_guaranteed: false,
  yieldPercent: 2.0,
  description: ''
})

function openEditModal(item: StockType) {
  editingItem.value = item
  editForm.value = {
    name: item.name,
    behavior: item.behavior,
    is_guaranteed: item.is_guaranteed,
    yieldPercent: item.guaranteed_yield !== null && item.guaranteed_yield !== undefined
      ? Number((item.guaranteed_yield * 100).toFixed(4))
      : 2.0,
    description: item.description || ''
  }
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingItem.value = null
}

// Delete Modal State
const showDeleteModal = ref(false)
const deletingItem = ref<StockType | null>(null)

function confirmDelete(item: StockType) {
  deletingItem.value = item
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deletingItem.value = null
}

// API Interactions
async function fetchStockTypes() {
  loading.value = true
  error.value = null
  try {
    stockTypes.value = await settingsApi.getStockTypes()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al cargar los tipos de acción'
    error.value = message
    toast.error(message)
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  submitting.value = true
  try {
    const yieldDecimal = createForm.value.is_guaranteed
      ? createForm.value.yieldPercent / 100
      : null

    await settingsApi.createStockType({
      name: createForm.value.name,
      code: createForm.value.code || undefined,
      behavior: createForm.value.behavior,
      is_guaranteed: createForm.value.is_guaranteed,
      guaranteed_yield: yieldDecimal,
      description: createForm.value.description || undefined
    })

    toast.success('Tipo de acción creado exitosamente')
    closeCreateModal()
    await fetchStockTypes()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al crear el tipo de acción'
    toast.error(msg)
  } finally {
    submitting.value = false
  }
}

async function handleUpdate() {
  if (!editingItem.value) return
  submitting.value = true
  try {
    const yieldDecimal = editForm.value.is_guaranteed
      ? editForm.value.yieldPercent / 100
      : null

    await settingsApi.updateStockType(editingItem.value.id, {
      name: editForm.value.name,
      behavior: editForm.value.behavior,
      is_guaranteed: editForm.value.is_guaranteed,
      guaranteed_yield: yieldDecimal,
      description: editForm.value.description || null
    })

    toast.success('Tipo de acción actualizado exitosamente')
    closeEditModal()
    await fetchStockTypes()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al actualizar el tipo de acción'
    toast.error(msg)
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  if (!deletingItem.value) return
  submitting.value = true
  try {
    await settingsApi.deleteStockType(deletingItem.value.id)
    toast.success('Tipo de acción eliminado exitosamente')
    closeDeleteModal()
    await fetchStockTypes()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar el tipo de acción'
    toast.error(msg)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchStockTypes()
})
</script>

<style scoped>
.stock-type-management {
  width: 100%;
}
</style>
