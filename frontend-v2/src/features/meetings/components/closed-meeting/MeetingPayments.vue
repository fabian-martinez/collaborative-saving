<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <div class="flex justify-between items-center mb-4">
        <h2 class="card-title text-xl">Pagos de Préstamos</h2>
        <select v-model="selectedMember" class="select select-bordered select-sm w-full max-w-xs">
          <option value="">Todos los socios</option>
          <option v-for="member in members" :key="member.id" :value="member.id">
            {{ member.name }}
          </option>
        </select>
      </div>
      
      <DataTable
        :data="payments"
        :columns="columns"
        :empty-message="'No hay pagos registrados'"
      >
        <template #cell-member="{ item }">
          <span class="font-medium">{{ getMemberName(item.member_id) }}</span>
        </template>
        
        <template #cell-principal="{ item }">
          {{ formatCurrency(getPrincipal(item)) }}
        </template>

        <template #cell-interest="{ item }">
          {{ formatCurrency(getInterest(item)) }}
        </template>

        <template #cell-total="{ item }">
          <div class="font-bold text-success">
            {{ formatCurrency(getTotal(item)) }}
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

const payments = computed(() => 
  props.operations.filter(op => {
    if (op.type !== 'LOAN_PAYMENT') return false
    if (selectedMember.value && op.member_id !== selectedMember.value) return false
    return true
  })
)

const columns = [
  { key: 'date', label: 'Fecha', format: 'date' as const },
  { key: 'member', label: 'Socio' },
  { key: 'principal', label: 'Capital' },
  { key: 'interest', label: 'Interés' },
  { key: 'total', label: 'Total Pagado' },
]

const getMemberName = (id: string | null) => {
  if (!id) return 'Desconocido'
  const member = props.members.find(m => m.id === id)
  return member ? member.name : id
}

const getPrincipal = (op: Operation) => {
  if (!op.entries) return 0
  // Usually negative in LOANS_RECEIVABLE
  const entry = op.entries.find(e => e.account_type === 'LOANS_RECEIVABLE')
  return entry ? Math.abs(entry.amount) : 0
}

const getInterest = (op: Operation) => {
  if (!op.entries) return 0
  // Usually negative (Check logic: Income = Credit = Negative?)
  // useMeetingSummary uses Math.abs(entry.amount)
  const entry = op.entries.find(e => e.account_type === 'INTEREST_INCOME')
  return entry ? Math.abs(entry.amount) : 0
}

const getTotal = (op: Operation) => {
  if (!op.entries) return 0
  // Cash usually Positive
  const entry = op.entries.find(e => e.account_type === 'CASH')
  return entry ? entry.amount : 0
}
</script>
