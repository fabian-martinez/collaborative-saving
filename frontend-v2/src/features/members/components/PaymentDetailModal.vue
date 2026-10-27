<template>
  <Modal :show="visible" title="Detalle de Pago" @close="$emit('close')">
    <div v-if="payment">
      <div class="payment-detail-header">
        <div class="detail-row">
          <span class="label">Operación ID:</span>
          <span class="value font-mono">{{ payment.operation_id }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Fecha:</span>
          <span class="value">{{ formatDate(payment.date) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Tipo:</span>
          <span class="value">{{ payment.type }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Total:</span>
          <span class="value font-mono font-bold">{{ formatCurrency(payment.total_amount) }}</span>
        </div>
      </div>
      <div class="payment-entries mt-4">
        <h4 class="entries-title">Asientos Contables</h4>
        <DataTable
          :data="payment.entries"
          :columns="entryColumns"
          empty-message="No hay asientos registrados"
        />
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import Modal from '@/shared/components/Modal.vue'
import DataTable from '@/shared/components/DataTable.vue'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { MemberPayment } from '@/api/members.api'

interface Column {
  key: string
  label: string
  format?: 'currency' | 'date' | 'datetime' | 'number' | 'percentage'
}

defineProps<{
  visible: boolean
  payment: MemberPayment | null
}>()

defineEmits<{
  close: []
}>()

const entryColumns: Column[] = [
  { key: 'type', label: 'Tipo' },
  { key: 'amount', label: 'Monto', format: 'currency' },
  { key: 'description', label: 'Descripción' }
]
</script>

<style scoped>
.payment-detail-header {
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
}

@media (min-width: 640px) {
  .payment-detail-header {
    padding: 1rem;
  }
}

.payment-detail-header > * + * {
  margin-top: 1rem;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

@media (min-width: 640px) {
  .detail-row {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 0;
  }
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.75rem;
}

@media (min-width: 640px) {
  .label {
    font-size: 0.875rem;
  }
}

.value {
  color: #1f2937;
  font-size: 0.875rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
  text-align: right;
}

@media (min-width: 640px) {
  .value {
    font-size: 1rem;
    text-align: left;
  }
}

.payment-entries {
  margin-top: 1.5rem;
}

.entries-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  word-wrap: break-word;
}

@media (min-width: 640px) {
  .entries-title {
    font-size: 1.125rem;
  }
}
</style>
