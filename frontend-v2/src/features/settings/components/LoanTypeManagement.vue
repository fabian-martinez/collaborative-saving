<template>
  <div class="loan-type-management">
    <Card title="Tipos de Préstamo" subtitle="Configura las condiciones de los diferentes tipos de préstamos disponibles.">
      <DataTable
        :columns="columns"
        :data="loanTypes"
        :loading="loading"
      >
        <template #cell-default_approved_amount="{ item }">
          {{ formatCurrency(Number(item.default_approved_amount)) }}
        </template>
        <template #cell-default_interest_rate="{ item }">
          {{ item.default_interest_rate }}%
        </template>
        <template #cell-amortization_type="{ item }">
          <Badge :variant="item.amortization_type === 'french' ? 'info' : 'warning'">
            {{ item.amortization_type === 'french' ? 'Francés' : 'Alemán' }}
          </Badge>
        </template>
      </DataTable>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { settingsApi, type LoanType } from '@/api/settings.api'
import Card from '@/shared/components/Card.vue'
import DataTable from '@/shared/components/DataTable.vue'
import Badge from '@/shared/components/Badge.vue'

const loanTypes = ref<LoanType[]>([])
const loading = ref(false)

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

onMounted(async () => {
  loading.value = true
  try {
    loanTypes.value = await settingsApi.getLoanTypes()
  } catch (error) {
    console.error('Error fetching loan types:', error)
  } finally {
    loading.value = false
  }
})
</script>
