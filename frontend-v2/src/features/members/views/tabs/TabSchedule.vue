<template>
  <div class="tab-schedule">
    <div class="schedule-header">
      <h2 class="section-title">Cronograma de Pagos</h2>
      <div class="schedule-controls">
        <select v-model="monthsToProject" class="select select-bordered" @change="loadSchedule">
          <option :value="3">3 meses</option>
          <option :value="6">6 meses</option>
          <option :value="12" selected>12 meses</option>
          <option :value="24">24 meses</option>
        </select>
      </div>
    </div>

    <template v-if="store.loadingPaymentSchedule">
      <LoadingSpinner :loading="true" message="Cargando cronograma..." />
    </template>

    <template v-else-if="!store.paymentSchedule">
      <div class="empty-state">
        <div class="empty-message">No hay cronograma disponible</div>
      </div>
    </template>

    <div v-else class="schedule-content">
      <!-- Resumen del Cronograma -->
      <Card title="Resumen" variant="elevated" class="summary-card">
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Total Pagado</div>
            <div class="summary-value font-mono font-bold text-green-600">
              {{ formatCurrency(store.paymentSchedule.summary.total_paid) }}
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Pendiente</div>
            <div class="summary-value font-mono font-bold text-orange-600">
              {{ formatCurrency(store.paymentSchedule.summary.total_pending) }}
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Próximo Pago</div>
            <div class="summary-value font-mono font-bold">
              {{ store.paymentSchedule.summary.next_payment_date ? formatDate(store.paymentSchedule.summary.next_payment_date) : 'N/A' }}
            </div>
            <div class="summary-amount font-mono">
              {{ formatCurrency(store.paymentSchedule.summary.next_payment_amount) }}
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Saldo Total</div>
            <div class="summary-value font-mono font-bold">
              {{ formatCurrency(store.paymentSchedule.summary.total_outstanding_balance) }}
            </div>
          </div>
        </div>
      </Card>

      <!-- Timeline de Pagos -->
      <div class="timeline-section">
        <h3 class="timeline-title">Historial y Proyecciones</h3>
        <Timeline
          :items="allPayments"
          :item-status="(item) => item.status"
          :item-title="(item) => getPaymentTitle(item)"
          :item-description="(item) => getPaymentDescription(item)"
          :item-date="(item) => item.date"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Card from '@/shared/components/Card.vue'
import Timeline, { type TimelineItem } from '@/shared/components/Timeline.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { PaymentScheduleItem } from '@/api/members.api'
import type { useMemberDetailStore } from '@/features/members/stores/memberDetail'

const props = defineProps<{
  memberId: string
  store: ReturnType<typeof useMemberDetailStore>
}>()

const monthsToProject = ref(12)

const allPayments = computed<TimelineItem[]>(() => {
  if (!props.store.paymentSchedule) return []
  
  const items: TimelineItem[] = []
  
  // Pagos históricos
  props.store.paymentSchedule.historical_payments.forEach(item => {
    items.push({
      id: item.operation_id || `hist-${item.date}`,
      date: item.date,
      title: `Pago de ${item.loan_type || 'Préstamo'}`,
      description: `Interés: ${formatCurrency(item.interest_amount)}, Capital: ${formatCurrency(item.principal_amount)}`,
      status: 'completed',
      type: 'historical',
      ...item
    })
  })
  
  // Pagos proyectados
  props.store.paymentSchedule.projected_payments.forEach(item => {
    items.push({
      id: `proj-${item.date}-${item.payment_number}`,
      date: item.date,
      title: `Pago Proyectado - ${item.loan_type || 'Préstamo'}`,
      description: `Interés: ${formatCurrency(item.interest_amount)}, Capital: ${formatCurrency(item.principal_amount)}, Saldo Restante: ${formatCurrency(item.remaining_balance || 0)}`,
      status: item.status === 'overdue' ? 'overdue' : 'upcoming',
      type: 'projected',
      ...item
    })
  })
  
  // Ordenar por fecha
  return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
})

async function loadSchedule() {
  await props.store.fetchPaymentSchedule(props.memberId, { months: monthsToProject.value })
}

function getPaymentTitle(item: PaymentScheduleItem & TimelineItem): string {
  if (item.type === 'historical') {
    return `Pago Realizado - ${item.loan_type || 'Préstamo'}`
  }
  return `Pago Proyectado - ${item.loan_type || 'Préstamo'}`
}

function getPaymentDescription(item: PaymentScheduleItem & TimelineItem): string {
  const parts = [
    `Total: ${formatCurrency(item.total_amount)}`,
    `Interés: ${formatCurrency(item.interest_amount)}`,
    `Capital: ${formatCurrency(item.principal_amount)}`
  ]
  if (item.remaining_balance) {
    parts.push(`Saldo: ${formatCurrency(item.remaining_balance)}`)
  }
  return parts.join(' | ')
}

watch(() => props.memberId, () => {
  if (props.memberId) {
    loadSchedule()
  }
}, { immediate: true })

watch(monthsToProject, () => {
  if (props.memberId) {
    loadSchedule()
  }
})
</script>

<style scoped>
.tab-schedule {
  padding: 1rem 0;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.schedule-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (min-width: 640px) {
  .schedule-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
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
  }
}

.schedule-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.schedule-content > * + * {
  margin-top: 2rem;
}

.summary-card {
  margin-bottom: 2rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1rem 0;
}

@media (min-width: 640px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .summary-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

.summary-item {
  text-align: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
}

@media (min-width: 640px) {
  .summary-item {
    padding: 1rem;
  }
}

.summary-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 500;
  word-wrap: break-word;
}

@media (min-width: 640px) {
  .summary-label {
    font-size: 0.875rem;
  }
}

.summary-value {
  font-size: 1rem;
  color: #1f2937;
  margin-bottom: 0.25rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

@media (min-width: 640px) {
  .summary-value {
    font-size: 1.25rem;
  }
}

.summary-amount {
  font-size: 0.75rem;
  color: #6b7280;
  word-wrap: break-word;
}

@media (min-width: 640px) {
  .summary-amount {
    font-size: 0.875rem;
  }
}

.timeline-section {
  margin-top: 2rem;
}

.timeline-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  word-wrap: break-word;
}

@media (min-width: 640px) {
  .timeline-title {
    font-size: 1.25rem;
  }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-message {
  font-size: 1.125rem;
  color: #6b7280;
}
</style>

