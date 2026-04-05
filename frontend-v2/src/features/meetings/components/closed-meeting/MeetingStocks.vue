<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <div class="flex justify-between items-center mb-4">
        <h2 class="card-title text-xl">Movimientos de Acciones</h2>
        <select v-model="selectedMember" class="select select-bordered select-sm w-full max-w-xs">
          <option value="">Todos los socios</option>
          <option v-for="member in members" :key="member.id" :value="member.id">
            {{ member.name }}
          </option>
        </select>
      </div>
      
      <DataTable
        :data="stockOperations"
        :columns="columns"
        :empty-message="'No hay movimientos de acciones registrados'"
      >
        <template #cell-member="{ item }">
          <span class="font-medium">{{ getMemberName(item.member_id) }}</span>
        </template>

        <template #cell-type="{ item }">
          <span :class="getTypeClass(item.type)">
            {{ formatType(item.type) }}
          </span>
        </template>
        
        <template #cell-amount="{ item }">
          {{ formatCurrency(getAmount(item)) }}
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Operation } from '@/api/operations.api'
import type { Member } from '@/api/members.api'
import DataTable from '@/shared/components/DataTable.vue'
import { formatCurrency } from '@/shared/utils/formatters'

const props = defineProps<{
  operations: Operation[]
  members: Member[]
}>()

const selectedMember = ref('')

const stockOperations = computed(() => 
  props.operations.filter(op => {
    if (!['STOCK_PURCHASE', 'STOCK_WITHDRAWAL', 'STOCK_TRANSFER'].includes(op.type)) return false
    if (selectedMember.value && op.member_id !== selectedMember.value) return false
    return true
  })
)

const columns = [
  { key: 'date', label: 'Fecha', format: 'date' as const },
  { key: 'member', label: 'Socio' },
  { key: 'type', label: 'Tipo' },
  { key: 'amount', label: 'Valor' },
]

const getMemberName = (id: string | null) => {
  if (!id) return 'Desconocido'
  const member = props.members.find(m => m.id === id)
  return member ? member.name : id
}

const formatType = (type: string) => {
  const map: Record<string, string> = {
    'STOCK_PURCHASE': 'Compra',
    'STOCK_WITHDRAWAL': 'Liquidación',
    'STOCK_TRANSFER': 'Transferencia'
  }
  return map[type] || type
}

const getTypeClass = (type: string) => {
  if (type === 'STOCK_PURCHASE') return 'badge badge-success badge-outline'
  if (type === 'STOCK_WITHDRAWAL') return 'badge badge-error badge-outline'
  return 'badge badge-outline'
}

const getAmount = (op: Operation) => {
  if (!op.entries) return 0
  const entry = op.entries.find(e => e.account_type === 'CASH')
  return entry ? Math.abs(entry.amount) : 0
}

const exportData = async () => {
  const { exportToCSV } = await import('@/shared/utils/export')
  const { formatDate } = await import('@/shared/utils/formatters')
  const data = stockOperations.value.map(op => ({
    Fecha: formatDate(op.date),
    Socio: getMemberName(op.member_id),
    Tipo: formatType(op.type),
    Monto: getAmount(op)
  }))
  exportToCSV(data, `acciones-reunion-${props.operations[0]?.meeting_id.substring(0, 8)}`)
}

defineExpose({
  exportData
})
</script>
