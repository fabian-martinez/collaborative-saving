<template>
  <div class="stock-type-management">
    <Card title="Tipos de Acciones" subtitle="Define los tipos de activos en los que se invierte el capital.">
      <DataTable
        :columns="columns"
        :data="stockTypes"
        :loading="loading"
      >
        <template #cell-behavior="{ item }">
          <Badge :variant="getBehaviorVariant((item as any).behavior)">
            {{ getBehaviorLabel((item as any).behavior) }}
          </Badge>
        </template>
      </DataTable>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { settingsApi, type StockType } from '@/api/settings.api'
import Card from '@/shared/components/Card.vue'
import DataTable from '@/shared/components/DataTable.vue'
import Badge from '@/shared/components/Badge.vue'

const stockTypes = ref<StockType[]>([])
const loading = ref(false)

const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'behavior', label: 'Comportamiento' }
]

const getBehaviorVariant = (behavior: string) => {
  switch (behavior) {
    case 'share': return 'success'
    case 'bond': return 'info'
    case 'fixed': return 'warning'
    default: return 'neutral'
  }
}

const getBehaviorLabel = (behavior: string) => {
  switch (behavior) {
    case 'share': return 'Acción'
    case 'bond': return 'Bono'
    case 'fixed': return 'Fijo'
    default: return behavior
  }
}

onMounted(async () => {
  loading.value = true
  try {
    stockTypes.value = await settingsApi.getStockTypes()
  } catch (error) {
    console.error('Error fetching stock types:', error)
  } finally {
    loading.value = false
  }
})
</script>
