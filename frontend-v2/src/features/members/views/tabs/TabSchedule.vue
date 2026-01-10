<template>
  <div class="tab-schedule">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-6">
      <h2 class="text-xl sm:text-2xl font-bold text-base-content">Cronograma de Pagos</h2>
      <div class="flex gap-4 items-center">
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
      <div class="text-center py-16 px-8">
        <div class="text-lg text-base-content/60">No hay cronograma disponible</div>
      </div>
    </template>

    <div v-else class="space-y-6">
      <!-- Resumen del Cronograma -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h3 class="card-title">Resumen</h3>
          <div class="stats stats-vertical sm:stats-horizontal shadow w-full">
            <div class="stat">
              <div class="stat-title">Total Pagado</div>
              <div class="stat-value text-success font-mono text-lg sm:text-xl">
                {{ formatCurrency(store.paymentSchedule.summary.total_paid) }}
              </div>
            </div>
            <div class="stat">
              <div class="stat-title">Total Pendiente</div>
              <div class="stat-value text-warning font-mono text-lg sm:text-xl">
                {{ formatCurrency(store.paymentSchedule.summary.total_pending) }}
              </div>
            </div>
            <div class="stat">
              <div class="stat-title">Próximo Pago</div>
              <div class="stat-value font-mono text-base sm:text-lg">
                {{ store.paymentSchedule.summary.next_payment_date ? formatDate(store.paymentSchedule.summary.next_payment_date) : 'N/A' }}
              </div>
              <div class="stat-desc font-mono">
                {{ formatCurrency(store.paymentSchedule.summary.next_payment_amount) }}
              </div>
            </div>
            <div class="stat">
              <div class="stat-title">Saldo Total</div>
              <div class="stat-value font-mono text-lg sm:text-xl">
                {{ formatCurrency(store.paymentSchedule.summary.total_outstanding_balance) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline de Pagos -->
      <div class="mt-6">
        <h3 class="text-xl sm:text-2xl font-bold text-base-content mb-4">Historial y Proyecciones</h3>
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
  min-width: 0;
  overflow-x: hidden;
  box-sizing: border-box;
}

</style>

