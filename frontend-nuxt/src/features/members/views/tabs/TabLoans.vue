<template>
  <div class="py-4 w-full max-w-full min-w-0 overflow-x-hidden">
    <div class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
      <div class="filters">
        <select v-model="filterStatus" class="select select-bordered">
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="closed">Cerrados</option>
          <option value="pending">Pendientes</option>
        </select>
      </div>
    </div>

    <LoadingSpinner :loading="store.loadingLoans" message="Cargando préstamos..." />

    <div v-if="!store.loadingLoans && filteredLoans.length === 0" class="text-center py-8 text-base-content/60">
      No hay préstamos registrados
    </div>

    <div v-if="!store.loadingLoans && filteredLoans.length > 0" class="loans-list space-y-4">
      <LoanDetail
        v-for="loan in filteredLoans"
        :key="loan.id"
        :loan="loan"
        @pay="handlePay"
        @pay-with-stock="handlePayWithStock"
        @view-schedule="handleViewSchedule"
      />
    </div>

    <!-- Cálculo de Seguro -->
    <div class="card bg-base-100 shadow-lg mt-6">
      <div class="card-body">
        <h3 class="card-title">Cálculo de Seguro</h3>
        <LoadingSpinner :loading="store.loadingInsurance" message="Calculando..." />
        <div v-if="!store.loadingInsurance" class="space-y-4">
          <div class="mb-4">
            <label class="block mb-2 font-medium text-base-content/80 text-sm sm:text-base">Abono a Capital (opcional)</label>
            <input
              v-model.number="capitalPayment"
              type="number"
              step="0.01"
              min="0"
              class="input input-bordered w-full"
              placeholder="0"
            />
          </div>
          <div class="p-4 sm:p-6 bg-base-200 rounded-lg text-center my-4">
            <div class="text-xs sm:text-sm text-base-content/70 mb-2">Seguro Calculado:</div>
            <div class="text-primary text-2xl sm:text-4xl break-words font-mono font-bold">
              {{ formatCurrency(insuranceAmount) }}
            </div>
          </div>
          <button class="btn btn-primary mt-4" @click="calculateInsurance" :disabled="store.loadingInsurance">
            {{ store.loadingInsurance ? 'Calculando...' : 'Recalcular Seguro' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import LoanDetail from '@/features/members/components/LoanDetail.vue'
import { formatCurrency } from '@/shared/utils/formatters'
import type { Loan } from '@/api/members.api'
import type { useMemberDetailStore } from '@/features/members/stores/memberDetail'

const props = defineProps<{
  memberId: string
  store: ReturnType<typeof useMemberDetailStore>
}>()

const emit = defineEmits<{
  'view-loan': [loanId: string]
  'pay-loan': [loanId: string]
}>()

const filterStatus = ref<'all' | 'active' | 'closed' | 'pending'>('all')
const capitalPayment = ref(0)
const insuranceAmount = ref(0)

const filteredLoans = computed(() => {
  if (filterStatus.value === 'all') {
    return props.store.loans
  }
  return props.store.loans.filter(loan => {
    if (filterStatus.value === 'active') return loan.status === 'active'
    if (filterStatus.value === 'closed') return loan.status === 'closed' || loan.status === 'paid'
    if (filterStatus.value === 'pending') return loan.status === 'pending'
    return true
  })
})

async function calculateInsurance() {
  await props.store.fetchInsurance(props.memberId, capitalPayment.value || undefined)
  if (props.store.insurance) {
    insuranceAmount.value = props.store.insurance.insurance_amount
  }
}

function handlePay(loan: Loan) {
  emit('pay-loan', loan.id)
}

function handlePayWithStock(loan: Loan) {
  // Navigate to stock payment form
  console.log('Pay with stock:', loan)
}

function handleViewSchedule(loan: Loan) {
  emit('view-loan', loan.id)
}

watch(() => props.store.insurance, (insurance) => {
  if (insurance) {
    insuranceAmount.value = insurance.insurance_amount
  }
}, { immediate: true })
</script>
