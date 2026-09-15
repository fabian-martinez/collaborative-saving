<!--
  Copyright 2026 Collaborative Saving Project.
  All rights reserved.
-->
<template>
  <div class="loan-type-management space-y-6">
    <!-- Action Bar -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-xl font-bold">Tipos de Préstamo</h2>
        <p class="text-sm text-base-content/70">
          Configura las líneas de crédito disponibles, tasas mensuales y condiciones.
        </p>
      </div>
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <div class="relative flex-1 sm:w-64">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar tipo de préstamo..."
            aria-label="Buscar tipos de préstamo"
            class="input input-bordered w-full pl-10 input-sm sm:input-md"
          />
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <button
          @click="openCreateModal"
          class="btn btn-primary btn-sm sm:btn-md"
          aria-label="Crear nuevo tipo de préstamo"
        >
          <Plus class="w-4 h-4 mr-1" />
          Nuevo Tipo
        </button>
      </div>
    </div>

    <!-- Loading and Error States -->
    <LoadingSpinner :loading="loading" message="Cargando tipos de préstamo..." />
    <ErrorMessage v-if="error && !loading" :error="error" />

    <!-- Table -->
    <div v-if="!loading && !error" class="card bg-base-100 shadow-sm border border-base-200">
      <DataTable
        :data="filteredLoanTypes"
        :columns="columns"
        :actions="true"
        :empty-message="searchQuery ? 'No se encontraron tipos de préstamo para la búsqueda' : 'No hay tipos de préstamo configurados'"
        row-key="id"
      >
        <!-- Code Column -->
        <template #cell-code="{ item }">
          <span class="badge badge-outline font-mono text-xs">{{ item.code }}</span>
        </template>

        <!-- Interest Rate Column -->
        <template #cell-interest_rate="{ item }">
          <span class="font-semibold text-primary">
            {{ (item.interest_rate * 100).toFixed(2) }}% mensual
          </span>
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
              title="Editar tipo de préstamo"
              aria-label="Editar"
            >
              <EditPencil class="w-4 h-4" />
            </button>
            <button
              @click="confirmDelete(item)"
              class="btn btn-sm btn-ghost text-error"
              title="Eliminar tipo de préstamo"
              aria-label="Eliminar"
            >
              <Trash class="w-4 h-4" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Modal Crear -->
    <Modal :show="showCreateModal" title="Nuevo Tipo de Préstamo" @close="closeCreateModal">
      <form data-testid="create-loan-type-form" @submit.prevent="handleCreate" class="space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Nombre <span class="text-error">*</span></span>
          </label>
          <input
            v-model.trim="createForm.name"
            type="text"
            required
            placeholder="ej. Préstamo Ágil"
            class="input input-bordered w-full"
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Código (Identificador único)</span>
          </label>
          <input
            v-model.trim="createForm.code"
            type="text"
            placeholder="ej. agil (opcional, se autogenera)"
            class="input input-bordered w-full font-mono text-sm"
          />
          <span class="text-xs text-base-content/60 mt-1">
            En minúsculas sin espacios. Si se omite, se generará a partir del nombre.
          </span>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Tasa de Interés Mensual (%) <span class="text-error">*</span></span>
          </label>
          <div class="relative">
            <input
              v-model.number="createForm.ratePercent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              required
              placeholder="ej. 1.5"
              class="input input-bordered w-full pr-12"
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-base-content/60 font-medium">
              %
            </span>
          </div>
          <span class="text-xs text-base-content/60 mt-1">
            Porcentaje de interés mensual aplicable al préstamo (ej. 1.5% = 0.015).
          </span>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Descripción</span>
          </label>
          <textarea
            v-model.trim="createForm.description"
            rows="3"
            placeholder="Condiciones, límites o notas adicionales de la línea de crédito..."
            class="textarea textarea-bordered w-full"
          ></textarea>
        </div>

        <div class="modal-action">
          <button type="button" @click="closeCreateModal" class="btn btn-ghost">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            <span v-if="submitting" class="loading loading-spinner loading-sm mr-1"></span>
            Crear Tipo
          </button>
        </div>
      </form>
    </Modal>

    <!-- Modal Editar -->
    <Modal :show="showEditModal" title="Editar Tipo de Préstamo" @close="closeEditModal">
      <form data-testid="edit-loan-type-form" @submit.prevent="handleUpdate" class="space-y-4" v-if="editingItem">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Código</span>
          </label>
          <input
            :value="editingItem.code"
            disabled
            type="text"
            class="input input-bordered w-full font-mono text-sm bg-base-200 cursor-not-allowed"
          />
          <span class="text-xs text-base-content/60 mt-1">
            El código es el identificador inmutable en la base de datos.
          </span>
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
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Tasa de Interés Mensual (%) <span class="text-error">*</span></span>
          </label>
          <div class="relative">
            <input
              v-model.number="editForm.ratePercent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              required
              class="input input-bordered w-full pr-12"
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-base-content/60 font-medium">
              %
            </span>
          </div>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Descripción</span>
          </label>
          <textarea
            v-model.trim="editForm.description"
            rows="3"
            class="textarea textarea-bordered w-full"
          ></textarea>
        </div>

        <div class="modal-action">
          <button type="button" @click="closeEditModal" class="btn btn-ghost">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            <span v-if="submitting" class="loading loading-spinner loading-sm mr-1"></span>
            Guardar Cambios
          </button>
        </div>
      </form>
    </Modal>

    <!-- Modal Eliminar / Confirmación -->
    <Modal :show="showDeleteModal" title="Confirmar Eliminación" @close="closeDeleteModal">
      <div v-if="deletingItem" class="space-y-4">
        <p>
          ¿Estás seguro de que deseas eliminar el tipo de préstamo
          <strong>{{ deletingItem.name }}</strong> (<code>{{ deletingItem.code }}</code>)?
        </p>
        <div class="alert alert-warning text-xs">
          <WarningTriangle class="w-4 h-4 flex-shrink-0" />
          <span>
            No es posible eliminar un tipo de préstamo si existen préstamos activos asociados en el sistema.
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
import { settingsApi, type LoanType } from '@/api/settings.api'

const toast = useToast()

// Data state
const loanTypes = ref<LoanType[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const submitting = ref(false)

// Columns configuration
const columns: Column[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'code', label: 'Código' },
  { key: 'interest_rate', label: 'Tasa Mensual' },
  { key: 'description', label: 'Descripción' }
]

// Filtered items
const filteredLoanTypes = computed(() => {
  if (!searchQuery.value.trim()) return loanTypes.value
  const q = searchQuery.value.toLowerCase()
  return loanTypes.value.filter(
    (lt) =>
      lt.name.toLowerCase().includes(q) ||
      lt.code.toLowerCase().includes(q) ||
      (lt.description && lt.description.toLowerCase().includes(q))
  )
})

// Create Modal State
const showCreateModal = ref(false)
const createForm = ref({
  name: '',
  code: '',
  ratePercent: 1.5,
  description: ''
})

function openCreateModal() {
  createForm.value = {
    name: '',
    code: '',
    ratePercent: 1.5,
    description: ''
  }
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

// Edit Modal State
const showEditModal = ref(false)
const editingItem = ref<LoanType | null>(null)
const editForm = ref({
  name: '',
  ratePercent: 1.5,
  description: ''
})

function openEditModal(item: LoanType) {
  editingItem.value = item
  editForm.value = {
    name: item.name,
    ratePercent: Number((item.interest_rate * 100).toFixed(4)),
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
const deletingItem = ref<LoanType | null>(null)

function confirmDelete(item: LoanType) {
  deletingItem.value = item
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deletingItem.value = null
}

// Actions
async function fetchLoanTypes() {
  loading.value = true
  error.value = null
  try {
    loanTypes.value = await settingsApi.getLoanTypes()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al cargar los tipos de préstamo'
    error.value = message
    toast.error(message)
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!createForm.value.name.trim()) return

  submitting.value = true
  try {
    const decimalRate = Number((createForm.value.ratePercent / 100).toFixed(4))
    await settingsApi.createLoanType({
      name: createForm.value.name.trim(),
      code: createForm.value.code.trim() || undefined,
      interest_rate: decimalRate,
      description: createForm.value.description.trim() || null
    })
    toast.success('Tipo de préstamo creado correctamente')
    closeCreateModal()
    await fetchLoanTypes()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al crear el tipo de préstamo'
    toast.error(message)
  } finally {
    submitting.value = false
  }
}

async function handleUpdate() {
  if (!editingItem.value || !editForm.value.name.trim()) return

  submitting.value = true
  try {
    const decimalRate = Number((editForm.value.ratePercent / 100).toFixed(4))
    await settingsApi.updateLoanType(editingItem.value.id, {
      name: editForm.value.name.trim(),
      interest_rate: decimalRate,
      description: editForm.value.description.trim() || null
    })
    toast.success('Tipo de préstamo actualizado correctamente')
    closeEditModal()
    await fetchLoanTypes()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al actualizar el tipo de préstamo'
    toast.error(message)
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  if (!deletingItem.value) return

  submitting.value = true
  try {
    await settingsApi.deleteLoanType(deletingItem.value.id)
    toast.success('Tipo de préstamo eliminado correctamente')
    closeDeleteModal()
    await fetchLoanTypes()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al eliminar el tipo de préstamo'
    toast.error(message)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchLoanTypes()
})
</script>

<style scoped>
.loan-type-management {
  width: 100%;
}
</style>
