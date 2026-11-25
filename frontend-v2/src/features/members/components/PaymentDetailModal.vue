<template>
  <Modal :show="visible" title="Detalle de Pago" max-width="max-w-xl" @close="$emit('close')">
    <div v-if="payment" class="space-y-5">
      <div class="bg-base-200 rounded-lg p-3 sm:p-4 divide-y divide-base-300">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2.5 first:pt-0 last:pb-0">
          <span class="text-xs sm:text-sm font-semibold text-base-content/70">Operación ID:</span>
          <span class="font-mono text-xs sm:text-sm text-base-content break-all sm:text-right">{{ payment.operation_id }}</span>
        </div>
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2.5 first:pt-0 last:pb-0">
          <span class="text-xs sm:text-sm font-semibold text-base-content/70">Fecha:</span>
          <span class="text-sm sm:text-base text-base-content">{{ formatDate(payment.date) }}</span>
        </div>
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2.5 first:pt-0 last:pb-0">
          <span class="text-xs sm:text-sm font-semibold text-base-content/70">Tipo:</span>
          <span class="text-sm sm:text-base text-base-content">{{ payment.type }}</span>
        </div>
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2.5 first:pt-0 last:pb-0">
          <span class="text-xs sm:text-sm font-semibold text-base-content/70">Total:</span>
          <span class="font-mono font-bold text-sm sm:text-base text-base-content">{{ formatCurrency(displayTotal) }}</span>
        </div>
      </div>

      <div>
        <h4 class="text-base sm:text-lg font-semibold text-base-content mb-3">Asientos Contables</h4>
        <DataTable
          :data="payment.entries"
          :columns="entryColumns"
          empty-message="No hay asientos registrados"
        >
          <template #cell-account_type="{ item }">
            <span class="font-mono text-xs">{{ item.account_type || item.type || '-' }}</span>
          </template>
        </DataTable>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/shared/components/Modal.vue'
import DataTable from '@/shared/components/DataTable.vue'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { MemberPayment } from '@/api/members.api'

interface Column {
  key: string
  label: string
  format?: 'currency' | 'date' | 'datetime' | 'number' | 'percentage'
}

const props = defineProps<{
  visible: boolean
  payment: MemberPayment | null
}>()

defineEmits<{
  close: []
}>()

const displayTotal = computed(() => {
  if (!props.payment) return 0
  if (props.payment.total_amount > 0) return props.payment.total_amount
  return (props.payment.entries ?? [])
    .filter(entry => entry.amount > 0)
    .reduce((sum, entry) => sum + entry.amount, 0)
})

const entryColumns: Column[] = [
  { key: 'account_type', label: 'Cuenta' },
  { key: 'amount', label: 'Monto', format: 'currency' },
  { key: 'description', label: 'Descripción' }
]
</script>
