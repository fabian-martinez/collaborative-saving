<template>
  <div class="py-4 space-y-5 w-full max-w-full min-w-0 overflow-x-hidden">
    <!-- Filtros por préstamo -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap gap-1.5 text-xs">
        <button
          :class="['btn btn-xs', selectedLoanId === 'all' ? 'btn-primary' : 'btn-ghost border border-base-300']"
          @click="selectedLoanId = 'all'"
        >
          Todos ({{ store.loans.length }})
        </button>
        <button
          v-for="loan in store.activeLoans"
          :key="loan.id"
          :class="['btn btn-xs', selectedLoanId === loan.id ? 'btn-primary' : 'btn-ghost border border-base-300']"
          @click="selectedLoanId = loan.id"
        >
          {{ loan.loan_type }}
        </button>
      </div>

      <span class="text-xs text-base-content/70 font-mono">
        Saldo consolidado: <strong class="text-base-content">{{ formatCurrency(store.activeLoansTotalAmount) }}</strong>
      </span>
    </div>

    <LoadingSpinner :loading="store.loadingLoans" message="Cargando préstamos..." />

    <div v-if="!store.loadingLoans && displayedLoans.length === 0" class="text-center py-8 text-base-content/60 text-sm">
      No hay préstamos registrados
    </div>

    <!-- Tarjetas de Préstamos -->
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div
        v-for="loan in displayedLoans"
        :key="loan.id"
        class="bg-base-200/60 border border-base-300 rounded-xl p-3.5 space-y-2 text-xs"
      >
        <div class="flex justify-between items-center gap-2">
          <span class="font-semibold text-base-content">{{ loan.loan_type }}</span>
          <div class="flex items-center gap-2">
            <span class="text-success font-medium">{{ getPaidPercentage(loan) }}%</span>
            <button
              class="btn btn-xs btn-ghost border border-base-300 text-primary"
              @click="$emit('edit-loan', loan)"
            >
              Editar
            </button>
          </div>
        </div>

        <p class="text-lg font-bold font-mono text-base-content">
          {{ formatCurrency(loan.outstanding_balance) }}
        </p>

        <progress
          class="progress progress-success w-full h-1.5"
          :value="Math.max(0, loan.approved_amount - loan.outstanding_balance)"
          :max="loan.approved_amount || 1"
        ></progress>

        <p class="text-base-content/70 font-mono">
          Próx. cuota: {{ formatCurrency(loan.monthly_payment_amount) }}
          <template v-if="nextDueDateLabel"> ({{ nextDueDateLabel }})</template>
        </p>
      </div>
    </div>

    <!-- Cronograma de Próximas Cuotas -->
    <div class="space-y-2">
      <h3 class="text-sm font-semibold text-base-content">Cronograma de Próximas Cuotas</h3>

      <LoadingSpinner :loading="store.loadingPaymentSchedule" message="Cargando cronograma..." />

      <div
        v-if="!store.loadingPaymentSchedule && filteredProjectedPayments.length === 0"
        class="text-center py-6 border border-base-300 rounded-xl text-xs text-base-content/60"
      >
        No hay cuotas futuras proyectadas para los préstamos seleccionados
      </div>

      <div v-else class="overflow-x-auto border border-base-300 rounded-xl">
        <table class="table table-sm w-full text-xs">
          <thead class="bg-base-200 text-base-content/70">
            <tr>
              <th>Vencimiento</th>
              <th>Préstamo</th>
              <th>Cuota #</th>
              <th>Estado</th>
              <th class="text-right">Valor Cuota</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in filteredProjectedPayments" :key="`${item.loan_id || 's'}-${idx}`">
              <td class="font-mono">{{ formatDate(item.date) }}</td>
              <td class="font-medium">{{ item.loan_type || 'Préstamo' }}</td>
              <td class="text-base-content/70">{{ item.payment_number ? `#${item.payment_number}` : '-' }}</td>
              <td>
                <span :class="['badge badge-xs', item.status === 'overdue' ? 'badge-error' : 'badge-warning']">
                  {{ item.status === 'overdue' ? 'Vencida' : 'Próxima' }}
                </span>
              </td>
              <td class="text-right font-semibold font-mono">{{ formatCurrency(item.total_amount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'
import type { Loan } from '@/api/members.api'
import type { useMemberDetailStore } from '@/features/members/stores/memberDetail'

const props = defineProps<{
  memberId: string
  store: ReturnType<typeof useMemberDetailStore>
}>()

defineEmits<{
  'edit-loan': [loan: Loan]
}>()

const selectedLoanId = ref<string>('all')

const displayedLoans = computed(() => {
  if (selectedLoanId.value === 'all') return props.store.loans
  return props.store.loans.filter(l => l.id === selectedLoanId.value)
})

const nextDueDateLabel = computed(() => {
  return props.store.nextDueInfo.date ? formatDate(props.store.nextDueInfo.date) : ''
})

const filteredProjectedPayments = computed(() => {
  const projected = props.store.paymentSchedule?.projected_payments || []
  const list =
    selectedLoanId.value === 'all'
      ? projected
      : projected.filter(item => item.loan_id === selectedLoanId.value)
  return list.slice(0, 12)
})

function getPaidPercentage(loan: Loan): number {
  if (!loan.approved_amount || loan.approved_amount <= 0) return 0
  return Math.max(
    0,
    Math.min(100, Math.round(((loan.approved_amount - loan.outstanding_balance) / loan.approved_amount) * 100))
  )
}
</script>
