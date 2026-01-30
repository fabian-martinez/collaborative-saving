<template>
  <div class="interest-distribution-management">
    <Card title="Distribución de Intereses" subtitle="Configura qué tipos de préstamos generan rendimientos para qué activos.">
      <div class="flex justify-end mb-4">
        <button class="btn btn-primary" @click="openModal()">
          Nueva Relación
        </button>
      </div>

      <DataTable
        :columns="columns"
        :data="configsWithNames"
        :loading="loading"
        actions
      >
        <template #actions="{ item }">
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-xs" @click="openModal(item as any)">
              Editar
            </button>
            <button class="btn btn-ghost btn-xs text-error" @click="confirmDelete(item as any)">
              Eliminar
            </button>
          </div>
        </template>
      </DataTable>
    </Card>

    <!-- Create/Edit Modal -->
    <Modal :show="showModal" :title="isEditing ? 'Editar Relación' : 'Nueva Relación de Distribución'" @close="showModal = false">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="form-control">
          <label class="label">Tipo de Préstamo</label>
          <select v-model="form.loan_type_id" class="select select-bordered w-full" required>
            <option disabled value="">Selecciona un tipo de préstamo</option>
            <option v-for="type in loanTypes" :key="type.id" :value="type.id">
              {{ type.name }}
            </option>
          </select>
        </div>

        <div class="form-control">
          <label class="label">Tipo de Acción / Activo Destino</label>
          <select v-model="form.stock_type_id" class="select select-bordered w-full" required>
            <option disabled value="">Selecciona un tipo de activo</option>
            <option v-for="type in stockTypes" :key="type.id" :value="type.id">
              {{ type.name }}
            </option>
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
import { ref, computed, onMounted } from 'vue'
import { settingsApi, type InterestDistributionConfig, type LoanType, type StockType } from '@/api/settings.api'
import Card from '@/shared/components/Card.vue'
import DataTable from '@/shared/components/DataTable.vue'
import Modal from '@/shared/components/Modal.vue'

const configs = ref<InterestDistributionConfig[]>([])
const loanTypes = ref<LoanType[]>([])
const stockTypes = ref<StockType[]>([])
const loading = ref(false)
const showModal = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const isEditing = computed(() => !!editingId.value)

const form = ref({
  loan_type_id: '',
  stock_type_id: ''
})

const columns = [
  { key: 'loan_name', label: 'Si el préstamo es' },
  { key: 'stock_name', label: 'El interés va para' }
]

const configsWithNames = computed(() => {
  return configs.value.map(c => ({
    ...c,
    loan_name: loanTypes.value.find(lt => lt.id === c.loan_type_id)?.name || 'Cargando...',
    stock_name: stockTypes.value.find(st => st.id === c.stock_type_id)?.name || 'Cargando...'
  }))
})

const fetchData = async () => {
  loading.value = true
  try {
    const [c, lt, st] = await Promise.all([
      settingsApi.getDistributionConfigs(),
      settingsApi.getLoanTypes(),
      settingsApi.getStockTypes()
    ])
    configs.value = c
    loanTypes.value = lt
    stockTypes.value = st
  } catch (error) {
    console.error('Error fetching distribution data:', error)
  } finally {
    loading.value = false
  }
}

const openModal = (item?: InterestDistributionConfig) => {
  if (item) {
    editingId.value = item.id
    form.value = {
      loan_type_id: item.loan_type_id,
      stock_type_id: item.stock_type_id
    }
  } else {
    editingId.value = null
    form.value = { loan_type_id: '', stock_type_id: '' }
  }
  showModal.value = true
}

const handleSubmit = async () => {
  saving.value = true
  try {
    if (isEditing.value && editingId.value) {
      await settingsApi.updateDistributionConfig(editingId.value, form.value)
    } else {
      await settingsApi.createDistributionConfig(form.value)
    }
    await fetchData()
    showModal.value = false
    form.value = { loan_type_id: '', stock_type_id: '' }
  } catch (error) {
    console.error('Error saving distribution config:', error)
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (item: InterestDistributionConfig) => {
  if (confirm('¿Estás seguro de eliminar esta relación?')) {
    try {
      await settingsApi.deleteDistributionConfig(item.id)
      await fetchData()
    } catch (error) {
      console.error('Error deleting distribution config:', error)
    }
  }
}

onMounted(fetchData)
</script>
