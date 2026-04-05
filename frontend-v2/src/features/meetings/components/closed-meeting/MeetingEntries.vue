<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <div class="flex justify-between items-center mb-4">
        <h2 class="card-title text-xl">Asientos Contables</h2>
        <select v-model="selectedMember" class="select select-bordered select-sm w-full max-w-xs">
          <option value="">Todos los socios</option>
          <option v-for="member in members" :key="member.id" :value="member.id">
            {{ member.name }}
          </option>
        </select>
      </div>
      
      <DataTable
        :data="entries"
        :columns="columns"
        :empty-message="'No hay asientos registrados'"
      >
        <template #cell-date="{ item }">
          {{ formatDate(item.date) }}
        </template>

        <template #cell-account="{ item }">
          <span class="font-mono text-sm">{{ item.account_type }}</span>
        </template>

        <template #cell-debit="{ item }">
          <span v-if="item.amount > 0" class="text-success">{{ formatCurrency(item.amount) }}</span>
          <span v-else>-</span>
        </template>

        <template #cell-credit="{ item }">
          <span v-if="item.amount < 0" class="text-error">{{ formatCurrency(Math.abs(item.amount)) }}</span>
          <span v-else>-</span>
        </template>

        <template #cell-member="{ item }">
           {{ getMemberName(item.member_id) }}
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Operation, LedgerEntry } from '@/api/operations.api'
import type { Member } from '@/api/members.api'
import DataTable from '@/shared/components/DataTable.vue'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'

const props = defineProps<{
  operations: Operation[]
  members: Member[]
}>()

const selectedMember = ref('')

interface FlatEntry extends LedgerEntry {
  date: string | Date
  member_id: string | null
  op_description: string | null
}

const entries = computed<FlatEntry[]>(() => {
  const flattened: FlatEntry[] = []
  props.operations.forEach(op => {
    // Basic optimization: if we are filtering by member and the op doesn't belong to them, skip it?
    // BUT ledger entries might not have member_id directly on them, usually they inherit from op.member_id. 
    // The current logic assigns op.member_id to the entry.
    
    if (selectedMember.value && op.member_id !== selectedMember.value) return

    if (op.entries) {
      op.entries.forEach(entry => {
        flattened.push({
          ...entry,
          date: op.date,
          member_id: op.member_id,
          op_description: op.description
        })
      })
    }
  })
  return flattened.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const columns = [
  { key: 'date', label: 'Fecha' },
  { key: 'account', label: 'Cuenta' },
  { key: 'description', label: 'Descripción' },
  { key: 'member', label: 'Socio' },
  { key: 'debit', label: 'Débito' },
  { key: 'credit', label: 'Crédito' },
]

const getMemberName = (id: string | null) => {
  if (!id) return '-'
  const member = props.members.find(m => m.id === id)
  return member ? member.name : id
}

const exportData = async () => {
  const { exportToCSV } = await import('@/shared/utils/export')
  const data = entries.value.map(entry => ({
    Fecha: formatDate(entry.date),
    Cuenta: entry.account_type,
    Descripción: entry.description,
    Socio: getMemberName(entry.member_id),
    Débito: entry.amount > 0 ? entry.amount : 0,
    Crédito: entry.amount < 0 ? Math.abs(entry.amount) : 0
  }))
  exportToCSV(data, `asientos-reunion-${props.operations[0]?.meeting_id.substring(0, 8)}`)
}

defineExpose({
  exportData
})
</script>
