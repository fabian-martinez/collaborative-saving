<template>
  <div class="loan-type-management">
    <Card title="Tipos de Préstamo" subtitle="Configura las condiciones de los diferentes tipos de préstamos disponibles.">
      <div class="flex justify-end mb-4">
        <button class="btn btn-primary" @click="openModal()">
          Nuevo Tipo de Préstamo
        </button>
      </div>

      <DataTable
        :columns="columns"
        :data="loanTypes"
        :loading="loading"
        actions
      >
        <template #cell-default_approved_amount="{ item }">
          {{ formatCurrency(Number(item.default_approved_amount)) }}
        </template>
        <template #cell-default_interest_rate="{ item }">
          {{ item.default_interest_rate * 100 }}%
        </template>
        <template #cell-amortization_type="{ item }">
          <Badge :variant="item.amortization_type === 'french' ? 'info' : 'warning'">
            {{ item.amortization_type === 'french' ? 'Francés' : 'Alemán' }}
          </Badge>
        </template>
        <template #actions="{ item }">
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-xs" @click="openModal(item as LoanType)">
              Editar
            </button>
            <button class="btn btn-ghost btn-xs text-error" @click="confirmDelete(item as LoanType)">
              Eliminar
            </button>
          </div>
        </template>
      </DataTable>
    </Card>

    <Modal :show="showModal" :title="isEditing ? 'Editar Tipo de Préstamo' : 'Nuevo Tipo de Préstamo'" @close="showModal = false">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="form-control">
          <label class="label">Nombre</label>
          <input v-model="form.name" type="text" class="input input-bordered w-full" required placeholder="Ej: Préstamo Ordinario" />
        </div>

        <div class="form-control">
          <label class="label">Monto Máximo Sugerido</label>
          <input v-model.number="form.default_approved_amount" type="number" class="input input-bordered w-full" required min="0" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label">Tasa de Interés (%)</label>
            <input v-model.number="interestRatePercent" type="number" step="0.01" class="input input-bordered w-full" required min="0" max="100" />
          </div>
          <div class="form-control">
            <label class="label">Plazo por Defecto (Meses)</label>
            <input v-model.number="form.default_term" type="number" class="input input-bordered w-full" required min="1" />
          </div>
        </div>

        <div class="form-control">
          <label class="label">Tipo de Amortización</label>
          <select v-model="form.amortization_type" class="select select-bordered w-full" required>
            <option value="french">Francés (Cuota Fija)</option>
            <option value="german">Alemán (Abono Fijo a Capital)</option>
          </select>
        </div>

        <div class="modal-action">
          <button type="button" class="btn" @click="showModal = false">Cancelar</button>
          <button type="submit" class="btn btn-primary" :loading="saving">Guardar</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { settingsApi, type LoanType } from '@/api/settings.api'
import Card from '@/shared/components/Card.vue'
import DataTable from '@/shared/components/DataTable.vue'
import Badge from '@/shared/components/Badge.vue'
import Modal from '@/shared/components/Modal.vue'

const loanTypes = ref<LoanType[]>([])
const loading = ref(false)
const showModal = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const isEditing = computed(() => !!editingId.value)

const form = ref({
  name: '',
  default_approved_amount: 0,
  default_interest_rate: 0,
  default_term: 12,
  amortization_type: 'french' as 'french' | 'german'
})

const interestRatePercent = computed({
  get: () => form.value.default_interest_rate * 100,
  set: (val: number) => { form.value.default_interest_rate = val / 100 }
})

const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'default_approved_amount', label: 'Monto Sugerido' },
  { key: 'default_interest_rate', label: 'Tasa Interés' },
  { key: 'default_term', label: 'Plazo (Meses)' },
  { key: 'amortization_type', label: 'Amortización' }
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value)
}

const fetchData = async () => {
  loading.value = true
  try {
    loanTypes.value = await settingsApi.getLoanTypes()
  } catch (error) {
    console.error('Error fetching loan types:', error)
  } finally {
    loading.value = false
  }
}

const openModal = (item?: LoanType) => {
  if (item) {
    editingId.value = item.id
    form.value = {
      name: item.name,
      default_approved_amount: item.default_approved_amount,
      default_interest_rate: item.default_interest_rate,
      default_term: item.default_term,
      amortization_type: item.amortization_type
    }
  } else {
    editingId.value = null
    form.value = {
      name: '',
      default_approved_amount: 0,
      default_interest_rate: 0.05,
      default_term: 12,
      amortization_type: 'french'
    }
  }
  showModal.value = true
}

const handleSubmit = async () => {
  saving.value = true
  try {
    if (isEditing.value && editingId.value) {
      await settingsApi.updateLoanType(editingId.value, form.value)
    } else {
      await settingsApi.createLoanType(form.value)
    }
    await fetchData()
    showModal.value = false
  } catch (error) {
    console.error('Error saving loan type:', error)
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (item: LoanType) => {
  if (confirm(`¿Estás seguro de eliminar el tipo de préstamo "${item.name}"?`)) {
    try {
      await settingsApi.deleteLoanType(item.id)
      await fetchData()
    } catch (error) {
      console.error('Error deleting loan type:', error)
    }
  }
}

onMounted(fetchData)
</script>
