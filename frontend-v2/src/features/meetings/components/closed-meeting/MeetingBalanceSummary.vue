<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <div class="flex justify-between items-center mb-4">
        <h2 class="card-title text-xl">Resumen de Saldos por Socio</h2>
        <button @click="downloadCSV" class="btn btn-sm btn-outline gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descargar CSV
        </button>
      </div>
      
      <div class="space-y-2">
        <!-- Accordion Item for each member -->
        <div 
          v-for="item in summaryData" 
          :key="item.memberId"
          class="border border-base-300 rounded-lg overflow-hidden"
        >
          <!-- Member Summary Row -->
          <div 
            @click="toggleMember(item.memberId)"
            class="cursor-pointer hover:bg-base-200 transition-colors p-4 flex justify-between items-center"
            :class="{ 'bg-primary/10': selectedMemberId === item.memberId }"
          >
            <div class="flex items-center gap-2">
              <!-- Expand/Collapse Icon -->
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                class="h-5 w-5 transition-transform"
                :class="{ 'rotate-90': selectedMemberId === item.memberId }"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span class="font-medium">{{ item.memberName }}</span>
            </div>
            <div class="flex gap-6 items-center">
              <div class="text-right">
                <div class="text-xs text-gray-500">Positivo</div>
                <div class="text-success font-semibold">{{ formatCurrency(item.positive) }}</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-gray-500">Negativo</div>
                <div class="text-error font-semibold">{{ formatCurrency(item.negative) }}</div>
              </div>
              <div class="text-right min-w-[120px]">
                <div class="text-xs text-gray-500">Diferencia</div>
                <div :class="item.difference >= 0 ? 'text-success font-bold' : 'text-error font-bold'">
                  {{ formatCurrency(item.difference) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Expanded Cash Movements Section -->
          <div 
            v-if="selectedMemberId === item.memberId"
            class="border-t border-base-300 bg-base-50 p-4"
          >
            <h3 class="font-semibold mb-3 text-sm">Movimientos en Efectivo</h3>
            
            <div v-if="getMemberCashEntries(item.memberId).length === 0" class="text-center py-4 text-gray-500">
              No hay movimientos en efectivo registrados para este socio
            </div>

            <div v-else>
              <DataTable
                :data="getMemberCashEntries(item.memberId)"
                :columns="movementColumns"
                :empty-message="'No hay movimientos'"
              >
                <template #cell-date="{ item: entry }">
                  {{ formatDate(entry.date) }}
                </template>

                <template #cell-type="{ item: entry }">
                  <span class="badge badge-ghost badge-sm">{{ entry.op_description || 'Sin descripción' }}</span>
                </template>

                <template #cell-inflow="{ item: entry }">
                  <span v-if="entry.amount > 0" class="text-success font-bold">{{ formatCurrency(entry.amount) }}</span>
                  <span v-else class="text-gray-400">-</span>
                </template>

                <template #cell-outflow="{ item: entry }">
                  <span v-if="entry.amount < 0" class="text-error font-bold">{{ formatCurrency(Math.abs(entry.amount)) }}</span>
                  <span v-else class="text-gray-400">-</span>
                </template>
              </DataTable>

              <!-- Member Totals -->
              <div class="mt-3 grid grid-cols-3 gap-3 bg-base-200 rounded-lg p-3">
                <div class="text-center">
                  <div class="text-xs text-gray-500">Total Entradas</div>
                  <div class="font-bold text-success">{{ formatCurrency(getMemberTotals(item.memberId).inflow) }}</div>
                </div>
                <div class="text-center">
                  <div class="text-xs text-gray-500">Total Salidas</div>
                  <div class="font-bold text-error">{{ formatCurrency(getMemberTotals(item.memberId).outflow) }}</div>
                </div>
                <div class="text-center">
                  <div class="text-xs text-gray-500">Neto</div>
                  <div 
                    class="font-bold" 
                    :class="getMemberTotals(item.memberId).net >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ formatCurrency(getMemberTotals(item.memberId).net) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Meeting Totals Footer -->
      <div class="mt-6 border-t pt-4 bg-base-200 rounded-lg p-4">
        <h3 class="font-bold text-lg mb-4">Totales de la Reunión</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-500">Total Positivo</span>
            <span class="text-xl font-bold text-success">{{ formatCurrency(totals.positive) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-500">Total Negativo</span>
            <span class="text-xl font-bold text-error">{{ formatCurrency(totals.negative) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-500">Diferencia Total</span>
            <span class="text-xl font-bold" :class="totals.difference >= 0 ? 'text-success' : 'text-error'">
              {{ formatCurrency(totals.difference) }}
            </span>
          </div>
        </div>
      </div>
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

const selectedMemberId = ref<string | null>(null)

interface MemberBalance {
  memberId: string
  memberName: string
  positive: number
  negative: number
  difference: number
}

interface CashEntry extends LedgerEntry {
  date: string | Date
  member_id: string | null
  op_description: string | null
}

const summaryData = computed<MemberBalance[]>(() => {
  return props.members.map(member => {
    let positive = 0
    let negative = 0

    const memberOps = props.operations.filter(op => op.member_id === member.id)

    memberOps.forEach(op => {
      if (op.entries) {
        op.entries.forEach(entry => {
          if (entry.account_type === 'CASH') {
            if (entry.amount > 0) {
              positive += entry.amount
            } else {
              negative += Math.abs(entry.amount)
            }
          }
        })
      }
    })

    return {
      memberId: member.id,
      memberName: member.name,
      positive,
      negative,
      difference: positive - negative
    }
  }).sort((a, b) => b.difference - a.difference)
})

const getMemberCashEntries = (memberId: string): CashEntry[] => {
  const flattened: CashEntry[] = []
  props.operations.forEach(op => {
    if (op.member_id !== memberId) return

    if (op.entries) {
      op.entries.forEach(entry => {
        if (entry.account_type === 'CASH') {
          flattened.push({
            ...entry,
            date: op.date,
            member_id: op.member_id,
            op_description: op.description
          })
        }
      })
    }
  })
  return flattened.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

const getMemberTotals = (memberId: string) => {
  const entries = getMemberCashEntries(memberId)
  return entries.reduce((acc, curr) => {
    if (curr.amount > 0) {
      acc.inflow += curr.amount
    } else {
      acc.outflow += Math.abs(curr.amount)
    }
    acc.net += curr.amount
    return acc
  }, { inflow: 0, outflow: 0, net: 0 })
}

const totals = computed(() => {
  return summaryData.value.reduce((acc, curr) => {
    acc.positive += curr.positive
    acc.negative += curr.negative
    acc.difference += curr.difference
    return acc
  }, { positive: 0, negative: 0, difference: 0 })
})

const toggleMember = (memberId: string) => {
  selectedMemberId.value = selectedMemberId.value === memberId ? null : memberId
}

const movementColumns = [
  { key: 'date', label: 'Fecha' },
  { key: 'type', label: 'Concepto' },
  { key: 'inflow', label: 'Entrada' },
  { key: 'outflow', label: 'Salida' },
]

const downloadCSV = () => {
  // CSV Headers
  const headers = ['Socio', 'Efectivo Positivo', 'Efectivo Negativo', 'Diferencia']
  
  // CSV Rows
  const rows = summaryData.value.map(item => [
    item.memberName,
    item.positive.toString(),
    item.negative.toString(),
    item.difference.toString()
  ])
  
  // Add totals row
  rows.push([
    'TOTALES',
    totals.value.positive.toString(),
    totals.value.negative.toString(),
    totals.value.difference.toString()
  ])
  
  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `balance_socios_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>
