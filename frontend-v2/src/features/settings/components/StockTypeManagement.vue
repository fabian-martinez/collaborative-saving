<template>
  <div class="stock-type-management">
    <Card title="Tipos de Acciones" subtitle="Define los tipos de activos en los que se invierte el capital.">
      <div class="flex justify-end mb-4">
        <button class="btn btn-primary" @click="openModal()">
          Nuevo Tipo de Activo
        </button>
      </div>

      <DataTable
        :columns="columns"
        :data="stockTypes"
        :loading="loading"
        actions
      >
        <template #cell-behavior="{ item }">
          <Badge :variant="getBehaviorVariant((item as any).behavior)">
            {{ getBehaviorLabel((item as any).behavior) }}
          </Badge>
        </template>
        <template #cell-isGuaranteed="{ item }">
          <Badge :variant="item.isGuaranteed ? 'success' : 'neutral'">
            {{ item.isGuaranteed ? 'Garantizado' : 'Variable' }}
          </Badge>
        </template>
        <template #cell-guaranteedYield="{ item }">
          <span v-if="item.isGuaranteed && item.guaranteedYield !== null" class="font-mono">
            {{ (item.guaranteedYield * 100).toFixed(1) }}%
          </span>
          <span v-else class="text-base-content/40">-</span>
        </template>
        <template #actions="{ item }">
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-xs" @click="openModal(item as StockType)">
              Editar
            </button>
            <button class="btn btn-ghost btn-xs text-error" @click="confirmDelete(item as StockType)">
              Eliminar
            </button>
          </div>
        </template>
      </DataTable>
    </Card>

    <Modal :show="showModal" :title="isEditing ? 'Editar Tipo de Activo' : 'Nuevo Tipo de Activo'" @close="showModal = false">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="form-control">
          <label class="label">Nombre</label>
          <input v-model="form.name" type="text" class="input input-bordered w-full" required placeholder="Ej: Acción Ordinaria" />
        </div>

        <div class="form-control">
          <label class="label">Comportamiento / Clase de Activo</label>
          <select v-model="form.behavior" class="select select-bordered w-full" required>
            <option value="CAPITAL_APPRECIATION">Solo Valorización (Acción)</option>
            <option value="DIVIDEND_YIELD">Valorización + Dividendos (Fondo/Bono)</option>
          </select>
        </div>

        <div class="form-control bg-base-200 p-4 rounded-lg">
          <label class="label cursor-pointer justify-start gap-4">
            <input v-model="form.isGuaranteed" type="checkbox" class="checkbox checkbox-primary" />
            <span class="label-text font-medium">¿Es de rendimiento garantizado?</span>
          </label>
          
          <div v-if="form.isGuaranteed" class="mt-4">
            <label class="label">Tasa de Rendimiento Garantizada (decimal, ej: 0.05)</label>
            <input v-model.number="form.guaranteedYield" type="number" step="0.001" min="0" max="1" class="input input-bordered w-full" required />
          </div>
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
import { settingsApi, type StockType } from '@/api/settings.api'
import Card from '@/shared/components/Card.vue'
import DataTable from '@/shared/components/DataTable.vue'
import Badge from '@/shared/components/Badge.vue'
import Modal from '@/shared/components/Modal.vue'

const stockTypes = ref<StockType[]>([])
const loading = ref(false)
const showModal = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const isEditing = computed(() => !!editingId.value)

const form = ref({
  name: '',
  behavior: 'CAPITAL_APPRECIATION' as 'CAPITAL_APPRECIATION' | 'DIVIDEND_YIELD',
  isGuaranteed: false,
  guaranteedYield: null as number | null
})

const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'behavior', label: 'Comportamiento' },
  { key: 'isGuaranteed', label: 'Tipo Rendimiento' },
  { key: 'guaranteedYield', label: 'Rentabilidad' }
]

const getBehaviorVariant = (behavior: string) => {
  switch (behavior) {
    case 'CAPITAL_APPRECIATION': return 'success'
    case 'DIVIDEND_YIELD': return 'info'
    default: return 'neutral'
  }
}

const getBehaviorLabel = (behavior: string) => {
  switch (behavior) {
    case 'CAPITAL_APPRECIATION': return 'Valorización'
    case 'DIVIDEND_YIELD': return 'Dividendos'
    default: return behavior
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    stockTypes.value = await settingsApi.getStockTypes()
  } catch (error) {
    console.error('Error fetching stock types:', error)
  } finally {
    loading.value = false
  }
}

const openModal = (item?: StockType) => {
  if (item) {
    editingId.value = item.id
    form.value = {
      name: item.name,
      behavior: item.behavior as any,
      isGuaranteed: item.isGuaranteed,
      guaranteedYield: item.guaranteedYield
    }
  } else {
    editingId.value = null
    form.value = {
      name: '',
      behavior: 'CAPITAL_APPRECIATION',
      isGuaranteed: false,
      guaranteedYield: null
    }
  }
  showModal.value = true
}

const handleSubmit = async () => {
  saving.value = true
  try {
    if (isEditing.value && editingId.value) {
      await settingsApi.updateStockType(editingId.value, form.value)
    } else {
      await settingsApi.createStockType(form.value)
    }
    await fetchData()
    showModal.value = false
  } catch (error) {
    console.error('Error saving stock type:', error)
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (item: StockType) => {
  if (confirm(`¿Estás seguro de eliminar el tipo de activo "${item.name}"?`)) {
    try {
      await settingsApi.deleteStockType(item.id)
      await fetchData()
    } catch (error) {
      console.error('Error deleting stock type:', error)
    }
  }
}

onMounted(fetchData)
</script>
