<template>
  <div class="py-4 w-full max-w-full min-w-0 overflow-x-hidden">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 w-full max-w-full min-w-0">
      <!-- Préstamos Activos (7 cols) -->
      <div class="md:col-span-7 card bg-base-200/60 border border-base-300">
        <div class="card-body p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-base-content">Préstamos Activos</h3>
            <button
              class="btn btn-xs btn-link no-underline"
              @click="$emit('view-detail', 'loans-schedule', 'all')"
            >
              Ver cronograma →
            </button>
          </div>

          <LoadingSpinner :loading="store.loadingLoans" message="Cargando préstamos..." />

          <div
            v-if="!store.loadingLoans && store.activeLoans.length === 0"
            class="text-center py-6 text-xs text-base-content/60"
          >
            No hay préstamos activos
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="loan in store.activeLoans.slice(0, 3)"
              :key="loan.id"
              class="bg-base-100 border border-base-300 rounded-lg p-3 space-y-2"
            >
              <div class="flex items-center justify-between gap-2 text-xs">
                <span class="font-semibold text-base-content break-words">{{ loan.loan_type }}</span>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-success font-medium">{{ getPaidPercentage(loan) }}% pagado</span>
                  <button
                    class="btn btn-xs btn-ghost text-primary"
                    @click="$emit('edit-loan', loan)"
                  >
                    Editar
                  </button>
                </div>
              </div>
              <progress
                class="progress progress-success w-full h-1.5"
                :value="Math.max(0, loan.approved_amount - loan.outstanding_balance)"
                :max="loan.approved_amount || 1"
              ></progress>
              <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span class="text-base-content/70">
                  Saldo: <strong class="text-base-content">{{ formatCurrency(loan.outstanding_balance) }}</strong>
                </span>
                <div class="flex items-center gap-2">
                  <span class="text-[11px] text-base-content/60">
                    Próx. cuota: {{ formatCurrency(loan.monthly_payment_amount) }}
                    <template v-if="nextDueDateLabel"> ({{ nextDueDateLabel }})</template>
                  </span>
                  <button
                    class="btn btn-xs btn-link no-underline px-1 text-[11px]"
                    @click="$emit('view-loan-detail', loan)"
                  >
                    Ver detalle →
                  </button>
                </div>
              </div>
            </div>

            <button
              v-if="store.activeLoans.length > 3"
              class="btn btn-xs btn-link no-underline"
              @click="$emit('view-detail', 'loans-schedule', 'all')"
            >
              Ver todos ({{ store.activeLoans.length }}) →
            </button>
          </div>
        </div>
      </div>

      <!-- Exigible Hoy (5 cols) -->
      <div class="md:col-span-5 card bg-base-200/60 border border-base-300">
        <div class="card-body p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-base-content">Exigible Hoy</h3>
            <button
              class="btn btn-xs btn-link no-underline font-mono"
              @click="$emit('view-detail', 'stocks-dues', 'all')"
            >
              {{ formatCurrency(store.totalPendingDues) }} →
            </button>
          </div>

          <div v-if="store.dues.length === 0" class="text-center py-6 text-xs text-base-content/60">
            No hay cuotas pendientes
          </div>

          <div v-else class="space-y-2 text-xs">
            <div
              v-for="due in store.dues.slice(0, 4)"
              :key="due.reference_id || due.description"
              class="bg-base-100 border border-base-300 rounded-lg p-2.5 flex items-center justify-between gap-2"
            >
              <div class="min-w-0">
                <p class="font-medium text-base-content truncate">{{ due.description }}</p>
                <span :class="['text-xs', due.type === 'stock_fee' ? 'text-warning' : 'text-base-content/60']">
                  {{ formatDueOrPaymentType(due.type) }}
                </span>
              </div>
              <span class="font-semibold font-mono shrink-0">{{ formatCurrency(due.amount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Portafolio de Acciones (5 cols) -->
      <div class="md:col-span-5 card bg-base-200/60 border border-base-300">
        <div class="card-body p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-base-content">Portafolio de Acciones</h3>
            <button
              class="btn btn-xs btn-link no-underline"
              @click="$emit('view-detail', 'stocks-dues', 'all')"
            >
              Gestionar →
            </button>
          </div>

          <LoadingSpinner :loading="store.loadingSubscriptions" message="Cargando acciones..." />

          <div
            v-if="!store.loadingSubscriptions && activeSubscriptions.length === 0"
            class="text-center py-4 text-xs text-base-content/60"
          >
            No hay acciones registradas
          </div>

          <div v-else class="space-y-2.5 text-xs">
            <div
              v-for="sub in activeSubscriptions"
              :key="sub.id"
              class="flex justify-between items-center"
            >
              <span class="text-base-content">{{ sub.stock_type }}</span>
              <span class="font-medium font-mono">{{ sub.quantity }} {{ sub.quantity === 1 ? 'unidad' : 'unidades' }}</span>
            </div>
            <div class="border-t border-base-300 pt-2 flex justify-between items-center font-semibold">
              <span>Total invertido</span>
              <span class="font-mono">{{ formatCurrency(store.totalInStocks) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Últimos Movimientos (7 cols) -->
      <div class="md:col-span-7 card bg-base-200/60 border border-base-300">
        <div class="card-body p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-base-content">Últimos Movimientos</h3>
            <button
              class="btn btn-xs btn-link no-underline"
              @click="$emit('view-detail', 'movements', 'all')"
            >
              Ver historial →
            </button>
          </div>

          <div v-if="recentPayments.length === 0" class="text-center py-4 text-xs text-base-content/60">
            No hay movimientos registrados
          </div>

          <div v-else class="divide-y divide-base-300 text-xs">
            <div
              v-for="payment in recentPayments"
              :key="payment.operation_id"
              class="py-2 flex items-center justify-between cursor-pointer hover:bg-base-100/60 px-1 rounded transition-colors"
              @click="$emit('view-detail', 'movements', payment.operation_id)"
            >
              <div>
                <p class="font-medium text-base-content">{{ formatDueOrPaymentType(payment.type) }}</p>
                <p class="text-base-content/60">{{ formatDate(payment.date) }}</p>
              </div>
              <span class="font-semibold font-mono">{{ formatCurrency(payment.total_amount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import { formatDueOrPaymentType } from '@/features/members/utils/memberLabels'
import type { Loan, Member } from '@/api/members.api'
import type { useMemberDetailStore } from '@/features/members/stores/memberDetail'

const props = defineProps<{
  member: Member
  store: ReturnType<typeof useMemberDetailStore>
}>()

defineEmits<{
  'view-detail': [type: string, id: string]
  'edit-loan': [loan: Loan]
  'view-loan-detail': [loan: Loan]
}>()

const activeSubscriptions = computed(() => {
  return props.store.stockSubscriptions.filter(sub => sub.status === 'active').slice(0, 5)
})

const recentPayments = computed(() => {
  return [...props.store.payments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4)
})

const nextDueDateLabel = computed(() => {
  return props.store.nextDueInfo.date ? formatDate(props.store.nextDueInfo.date) : ''
})

function getPaidPercentage(loan: Loan): number {
  if (!loan.approved_amount || loan.approved_amount <= 0) return 0
  return Math.max(
    0,
    Math.min(100, Math.round(((loan.approved_amount - loan.outstanding_balance) / loan.approved_amount) * 100))
  )
}
</script>
