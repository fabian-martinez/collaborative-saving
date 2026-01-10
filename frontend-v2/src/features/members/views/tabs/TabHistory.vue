<template>
  <div class="tab-history">
    <div class="history-header">
      <h2 class="section-title">Historial de Operaciones</h2>
      <div class="history-controls">
        <FilterBar
          :filters="filterConfig"
          :filter-options="{ type: operationTypeOptions }"
          @update:filters="handleFiltersUpdate"
        />
        <button class="btn btn-outline" @click="exportToCSV">
          Exportar CSV
        </button>
      </div>
    </div>

    <div v-if="allOperations.length === 0" class="empty-state">
      <div class="empty-icon">📜</div>
      <div class="empty-message">No hay operaciones registradas</div>
    </div>

    <div v-else>
      <Timeline
        :items="filteredOperations"
        :item-status="(item) => getStatus(item)"
        :item-title="(item) => getOperationTitle(item)"
        :item-description="(item) => getOperationDescription(item)"
        :item-date="(item) => getOperationDate(item)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import FilterBar, { type FilterConfig } from '@/shared/components/FilterBar.vue'
import Timeline, { type TimelineItem } from '@/shared/components/Timeline.vue'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { exportToCSV as exportCSV } from '@/shared/utils/export'
import type { useMemberDetailStore } from '@/features/members/stores/memberDetail'

const props = defineProps<{
  memberId: string
  store: ReturnType<typeof useMemberDetailStore>
}>()

const filters = ref<Record<string, unknown>>({})

const filterConfig: FilterConfig = {
  type: true,
  meetingId: true,
  dateRange: true,
  search: true
}

const operationTypeOptions = [
  { value: 'purchase', label: 'Compras' },
  { value: 'exchange', label: 'Intercambios' },
  { value: 'transfer', label: 'Transferencias' },
  { value: 'stock-loan-payment', label: 'Pagos con Acciones' }
]

const allOperations = computed<TimelineItem[]>(() => {
  const items: TimelineItem[] = []
  
  // Compras
  props.store.purchases.forEach(purchase => {
    items.push({
      id: purchase.operation_id,
      date: purchase.purchase_date,
      title: `Compra de ${purchase.stock_type}`,
      description: `${purchase.quantity} unidades x ${formatCurrency(purchase.unit_value)} = ${formatCurrency(purchase.total_value)}`,
      status: 'completed',
      type: 'purchase',
      ...purchase
    })
  })
  
  // Intercambios
  props.store.exchanges.forEach(exchange => {
    items.push({
      id: exchange.operation_id,
      date: exchange.date,
      title: 'Intercambio de Acciones',
      description: `De: ${exchange.from_stock_type} (${exchange.from_quantity}) → A: ${exchange.to_stock_type} (${exchange.to_quantity})`,
      status: 'completed',
      type: 'exchange',
      ...exchange
    })
  })
  
  // Transferencias
  props.store.transfers.forEach(transfer => {
    items.push({
      id: transfer.operation_id,
      date: transfer.date,
      title: 'Transferencia de Acciones',
      description: `${transfer.transfer_stock_type} - ${transfer.transfer_quantity} unidades`,
      status: 'completed',
      type: 'transfer',
      ...transfer
    })
  })
  
  // Pagos con acciones
  props.store.stockLoanPayments.forEach(payment => {
    items.push({
      id: payment.operation_id,
      date: payment.date,
      title: 'Pago con Acciones',
      description: `${payment.payment_stock_type} - ${payment.payment_quantity} unidades para préstamo ${payment.loan_id}`,
      status: 'completed',
      type: 'stock-loan-payment',
      ...payment
    })
  })
  
  // Ordenar por fecha (más reciente primero)
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const filteredOperations = computed(() => {
  let result = allOperations.value
  
  if (filters.value.type) {
    result = result.filter(op => op.type === filters.value.type)
  }
  
  if (filters.value.search) {
    const search = String(filters.value.search).toLowerCase()
    result = result.filter(op =>
      op.title?.toLowerCase().includes(search) ||
      op.description?.toLowerCase().includes(search) ||
      String(op.id).toLowerCase().includes(search)
    )
  }
  
  return result
})

function getStatus(item: TimelineItem): 'completed' | 'pending' | 'overdue' | 'upcoming' {
  return item.status as 'completed' | 'pending' | 'overdue' | 'upcoming' || 'completed'
}

function getOperationTitle(item: TimelineItem): string {
  return item.title || 'Operación'
}

function getOperationDescription(item: TimelineItem): string {
  return item.description || ''
}

function getOperationDate(item: TimelineItem): string | Date {
  return item.date
}

function handleFiltersUpdate(newFilters: Record<string, unknown>) {
  filters.value = newFilters
}

function exportToCSV() {
  const data = filteredOperations.value.map(op => ({
    Fecha: formatDate(op.date),
    Tipo: op.type,
    Título: op.title,
    Descripción: op.description,
    ID: op.id
  }))
  
  exportCSV(data, `historial-operaciones-${props.memberId}-${new Date().toISOString().split('T')[0]}.csv`)
}
</script>

<style scoped>
.tab-history {
  padding: 1rem 0;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.history-header {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 640px) {
  .history-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0;
  }
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  word-wrap: break-word;
}

@media (min-width: 640px) {
  .section-title {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }
}

.history-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

@media (min-width: 640px) {
  .history-controls {
    flex-direction: row;
    align-items: flex-end;
    width: auto;
  }
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

@media (min-width: 640px) {
  .empty-state {
    padding: 4rem 2rem;
  }
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

@media (min-width: 640px) {
  .empty-icon {
    font-size: 4rem;
  }
}

.empty-message {
  font-size: 1rem;
  color: #6b7280;
}

@media (min-width: 640px) {
  .empty-message {
    font-size: 1.125rem;
  }
}
</style>

