<template>
  <div class="py-4 w-full max-w-full overflow-x-hidden">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 sm:gap-6 w-full max-w-full overflow-x-hidden">
      <!-- Resumen de Acciones -->
      <Card title="Resumen de Acciones" variant="elevated" hover>
        <LoadingSpinner :loading="store.loadingSubscriptions" message="Cargando acciones..." />
        <div v-if="!store.loadingSubscriptions && store.stockSubscriptions.length === 0" class="text-center py-8 text-base-content/60">
          No hay acciones registradas
        </div>
        <div v-if="!store.loadingSubscriptions && store.stockSubscriptions.length > 0" class="space-y-4">
          <div v-for="sub in activeSubscriptions" :key="sub.id" class="py-3 border-b border-base-300 last:border-b-0">
            <div class="flex justify-between items-center">
              <div class="font-semibold text-base-content text-sm sm:text-base break-words">{{ sub.stock_type }}</div>
              <div class="text-base-content/70 text-xs sm:text-sm">{{ sub.quantity }} unidades</div>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t-2 border-base-300 text-center text-base sm:text-lg">
            <strong>Total: {{ formatCurrency(store.totalInStocks) }}</strong>
          </div>
          <button class="btn btn-sm btn-link mt-2" @click="$emit('view-detail', 'stocks', 'all')">
            Ver Detalle →
          </button>
        </div>
      </Card>

      <!-- Préstamos Activos -->
      <Card title="Préstamos Activos" variant="elevated" hover>
        <LoadingSpinner :loading="store.loadingLoans" message="Cargando préstamos..." />
        <div v-if="!store.loadingLoans && store.activeLoans.length === 0" class="text-center py-8 text-base-content/60">
          No hay préstamos activos
        </div>
        <div v-if="!store.loadingLoans && store.activeLoans.length > 0" class="space-y-4">
          <div v-for="loan in store.activeLoans.slice(0, 3)" :key="loan.id" class="py-3 border-b border-base-300 last:border-b-0">
            <div class="flex justify-between items-center mb-2">
              <span class="font-semibold text-base-content text-sm sm:text-base break-words">{{ loan.loan_type }}</span>
              <Badge variant="success" size="sm">Activo</Badge>
            </div>
            <ProgressBar
              :value="loan.approved_amount - loan.outstanding_balance"
              :max="loan.approved_amount"
              :label="`Saldo: ${formatCurrency(loan.outstanding_balance)}`"
              variant="success"
            />
              <div class="mt-2 flex justify-between">
              <span class="text-sm text-base-content/70">Próximo pago: {{ formatCurrency(loan.monthly_payment_amount) }}</span>
            </div>
          </div>
          <button v-if="store.activeLoans.length > 3" class="btn btn-sm btn-link mt-2" @click="$emit('view-detail', 'loans', 'all')">
            Ver Todos ({{ store.activeLoans.length }}) →
          </button>
        </div>
      </Card>

      <!-- Cuotas Pendientes -->
      <Card title="Cuotas Pendientes" variant="elevated" hover>
        <div v-if="store.dues.length === 0" class="text-center py-8 text-base-content/60">
          No hay cuotas pendientes
        </div>
        <div v-else class="space-y-4">
          <div class="space-y-4">
            <div v-for="due in store.dues.slice(0, 5)" :key="due.reference_id || due.description" class="py-3 border-b border-base-300 last:border-b-0">
              <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-1">
                <div class="text-xs sm:text-sm text-base-content/80 flex-1 break-words">{{ due.description }}</div>
                <Badge :variant="getDueVariant(due.type)" size="sm">{{ due.type }}</Badge>
              </div>
              <div class="font-semibold text-base-content text-sm sm:text-base whitespace-nowrap ml-2 sm:ml-4 font-mono">{{ formatCurrency(due.amount) }}</div>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t-2 border-base-300 text-center text-lg">
            <strong>Total Pendiente: {{ formatCurrency(store.totalPendingDues) }}</strong>
          </div>
          <button class="btn btn-sm btn-primary mt-2" @click="$emit('view-detail', 'dues', 'all')">
            Ver Todas →
          </button>
        </div>
      </Card>

      <!-- Últimas Transacciones -->
      <Card title="Últimas Transacciones" variant="elevated" hover>
        <div v-if="store.payments.length === 0" class="text-center py-8 text-base-content/60">
          No hay transacciones registradas
        </div>
        <div v-else class="space-y-4">
          <div v-for="payment in recentPayments" :key="payment.operation_id" class="py-3 border-b border-base-300 last:border-b-0 flex justify-between items-start">
            <div class="flex-1">
              <div class="font-semibold text-base-content text-xs sm:text-sm break-words">{{ payment.type }}</div>
              <div class="transaction-date text-sm text-base-content/70">{{ formatDate(payment.date) }}</div>
            </div>
            <div class="font-semibold text-base-content text-sm sm:text-base whitespace-nowrap font-mono">{{ formatCurrency(payment.total_amount) }}</div>
          </div>
          <button class="btn btn-sm btn-link mt-2" @click="$emit('view-detail', 'payments', 'all')">
            Ver Historial Completo →
          </button>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from '@/shared/components/Card.vue'
import Badge from '@/shared/components/Badge.vue'
import ProgressBar from '@/shared/components/ProgressBar.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { Member } from '@/api/members.api'
import type { useMemberDetailStore } from '@/features/members/stores/memberDetail'

const props = defineProps<{
  member: Member
  store: ReturnType<typeof useMemberDetailStore>
}>()

defineEmits<{
  'view-detail': [type: string, id: string]
}>()

const activeSubscriptions = computed(() => {
  return props.store.stockSubscriptions.filter(sub => sub.status === 'active').slice(0, 5)
})

const recentPayments = computed(() => {
  return props.store.payments
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
})

function getDueVariant(type: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    mandatory_contribution: 'info',
    stock_fee: 'warning',
    loan_payment: 'error',
    insurance: 'neutral',
    fee: 'warning'
  }
  return variants[type] || 'neutral'
}
</script>




