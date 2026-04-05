<template>
  <div class="tab-payments">
    <FilterBar
      :filters="filterConfig"
      :filter-options="{ type: paymentTypeOptions }"
      @update:filters="handleFiltersUpdate"
    />

    <div v-if="store.payments.length === 0" class="empty-state">
      <div class="empty-icon">💳</div>
      <div class="empty-message">No hay pagos registrados</div>
    </div>

    <div v-else>
      <DataTable
        :data="filteredPayments"
        :columns="paymentColumns"
        :actions="true"
        empty-message="No hay pagos que coincidan con los filtros"
      >
        <template #actions="{ item }">
          <button class="btn btn-sm btn-link" @click="viewPaymentDetail(item.operation_id as string)">
            Ver Detalle
          </button>
        </template>
      </DataTable>
    </div>

    <!-- Modal de Detalle de Pago -->
    <Modal :show="selectedPaymentId !== null" title="Detalle de Pago" @close="selectedPaymentId = null">
      <div v-if="selectedPayment">
        <div class="payment-detail-header">
          <div class="detail-row">
            <span class="label">Operación ID:</span>
            <span class="value font-mono">{{ selectedPayment.operation_id }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Fecha:</span>
            <span class="value">{{ formatDate(selectedPayment.date) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Tipo:</span>
            <span class="value">{{ selectedPayment.type }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Total:</span>
            <span class="value font-mono font-bold">{{ formatCurrency(selectedPayment.total_amount) }}</span>
          </div>
        </div>
        <div class="payment-entries mt-4">
          <h4 class="entries-title">Asientos Contables</h4>
          <DataTable
            :data="selectedPayment.entries"
            :columns="entryColumns"
            empty-message="No hay asientos registrados"
          />
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import FilterBar, { type FilterConfig } from '@/shared/components/FilterBar.vue'
import DataTable from '@/shared/components/DataTable.vue'
import Modal from '@/shared/components/Modal.vue'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { useMemberDetailStore } from '@/features/members/stores/memberDetail'

interface Column {
  key: string
  label: string
  format?: 'currency' | 'date' | 'datetime' | 'number' | 'percentage'
}

const props = defineProps<{
  memberId: string
  store: ReturnType<typeof useMemberDetailStore>
}>()

const emit = defineEmits<{
  'view-payment-detail': [paymentId: string]
}>()

const filters = ref<Record<string, unknown>>({})
const selectedPaymentId = ref<string | null>(null)

const filterConfig: FilterConfig = {
  type: true,
  meetingId: true,
  dateRange: true,
  search: true
}

const paymentTypeOptions = [
  { value: 'mandatory_contribution', label: 'Aporte Obligatorio' },
  { value: 'stock_fee', label: 'Cuota de Acción' },
  { value: 'loan_payment', label: 'Pago de Préstamo' },
  { value: 'insurance', label: 'Seguro' },
  { value: 'fee', label: 'Multa' },
  { value: 'novelty', label: 'Novedad' }
]

const paymentColumns: Column[] = [
  { key: 'date', label: 'Fecha', format: 'date' },
  { key: 'type', label: 'Tipo' },
  { key: 'description', label: 'Descripción' },
  { key: 'total_amount', label: 'Monto', format: 'currency' },
  { key: 'meeting_id', label: 'Reunión' }
]

const entryColumns: Column[] = [
  { key: 'type', label: 'Tipo' },
  { key: 'amount', label: 'Monto', format: 'currency' },
  { key: 'description', label: 'Descripción' }
]

const filteredPayments = computed(() => {
  let result = props.store.payments

  if (filters.value.type) {
    result = result.filter(p => p.type === filters.value.type)
  }

  if (filters.value.meetingId) {
    result = result.filter(p => p.meeting_id === filters.value.meetingId)
  }

  if (filters.value.search) {
    const search = String(filters.value.search).toLowerCase()
    result = result.filter(p =>
      p.description?.toLowerCase().includes(search) ||
      p.type.toLowerCase().includes(search) ||
      p.operation_id.toLowerCase().includes(search)
    )
  }

  return result
})

const selectedPayment = computed(() => {
  if (!selectedPaymentId.value) return null
  return props.store.payments.find(p => p.operation_id === selectedPaymentId.value)
})

function handleFiltersUpdate(newFilters: Record<string, unknown>) {
  filters.value = newFilters
  // Recargar pagos con los filtros aplicados
  const meetingId = newFilters.meetingId as string | undefined
  if (meetingId) {
    props.store.fetchPayments(props.memberId, meetingId)
  } else {
    props.store.fetchPayments(props.memberId)
  }
}

function viewPaymentDetail(paymentId: string) {
  selectedPaymentId.value = paymentId
  emit('view-payment-detail', paymentId)
}
</script>

<style scoped>
.tab-payments {
  padding: 1rem 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
  box-sizing: border-box;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-message {
  font-size: 1.125rem;
  color: #6b7280;
}

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
