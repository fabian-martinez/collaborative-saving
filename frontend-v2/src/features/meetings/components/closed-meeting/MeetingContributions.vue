<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <div class="flex justify-between items-center mb-4">
        <h2 class="card-title text-xl">Aportes</h2>
        <select v-model="selectedMember" class="select select-bordered select-sm w-full max-w-xs">
          <option value="">Todos los socios</option>
          <option v-for="member in members" :key="member.id" :value="member.id">
            {{ member.name }}
          </option>
        </select>
      </div>
      
      <DataTable
        :data="contributions"
        :columns="columns"
        :empty-message="'No hay aportes registrados'"
      >
        <template #cell-member="{ item }">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ getMemberName(item.member_id) }}</span>
          </div>
        </template>
        
        <template #cell-amount="{ item }">
          <div class="font-medium text-success">
            {{ formatCurrency(getAmount(item)) }}
          </div>
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

const contributions = computed(() => 
  props.operations.filter(op => {
    if (op.type !== 'MONTHLY_PAYMENT') return false
    if (selectedMember.value && op.member_id !== selectedMember.value) return false
    return true
  })
)

const columns = [
  { key: 'date', label: 'Fecha', format: 'date' as const },
  { key: 'member', label: 'Socio' },
  { key: 'amount', label: 'Monto Total' },
]

const getMemberName = (id: string | null) => {
  if (!id) return 'Desconocido'
  const member = props.members.find(m => m.id === id)
  return member ? member.name : id
}

const getAmount = (op: Operation) => {
  // Sum positive CASH entries
  if (!op.entries) return 0
  return op.entries.reduce((sum, entry) => {
    if (entry.account_type === 'CASH' && entry.amount > 0) {
      return sum + entry.amount
    }
    return sum
  }, 0)
}

const exportData = async () => {
  const { exportToCSV } = await import('@/shared/utils/export')
  const { formatDate } = await import('@/shared/utils/formatters')
  const data = contributions.value.map(op => ({
    Fecha: formatDate(op.date),
    Socio: getMemberName(op.member_id),
    Monto: getAmount(op)
  }))
  exportToCSV(data, `aportes-reunion-${props.operations[0]?.meeting_id.substring(0, 8)}`)
}

defineExpose({
  exportData
})
</script>
