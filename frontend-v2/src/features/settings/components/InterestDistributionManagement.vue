<template>
  <div class="interest-distribution-management">
    <Card title="Distribución de Intereses" subtitle="Configura qué tipos de préstamos generan rendimientos para qué activos.">
      <div class="flex justify-end mb-4">
        <button class="btn btn-primary" @click="showCreateModal = true">
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
          <button class="btn btn-ghost btn-xs text-error" @click="confirmDelete(item as any)">
            Eliminar
          </button>
        </template>
      </DataTable>
    </Card>

    <!-- Create Modal -->
    <Modal :show="showCreateModal" title="Nueva Relación de Distribución" @close="showCreateModal = false">
      <form @submit.prevent="handleCreate" class="space-y-4">
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
          <button type="button" class="btn" @click="showCreateModal = false">Cancelar</button>
          <button type="submit" class="btn btn-primary" :loading="creating">Guardar</button>
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
const showCreateModal = ref(false)
const creating = ref(false)

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

const handleCreate = async () => {
  creating.value = true
  try {
    await settingsApi.createDistributionConfig(form.value)
    await fetchData()
    showCreateModal.value = false
    form.value = { loan_type_id: '', stock_type_id: '' }
  } catch (error) {
    console.error('Error creating distribution config:', error)
  } finally {
    creating.value = false
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
