<template>
  <div class="collapse collapse-arrow bg-base-100 border border-base-300 rounded-lg" :class="{ 'collapse-open': isExpanded }">
    <input type="checkbox" :checked="isExpanded" @change="toggleExpanded" aria-label="Expandir detalles del préstamo" />
    <div class="collapse-title text-base font-medium">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 w-full">
        <div class="flex items-center gap-3 flex-wrap">
          <span class="font-semibold text-sm sm:text-base break-words">{{ loan.loan_type }}</span>
          <span :class="['badge', `badge-${getStatusVariant(loan.status)}`]">
            {{ getStatusLabel(loan.status) }}
          </span>
        </div>
        <div class="text-left sm:text-right shrink-0">
          <div class="text-xs sm:text-sm text-base-content/70 mb-1">Saldo Pendiente</div>
          <div class="text-base sm:text-lg font-bold font-mono break-words">{{ formatCurrency(loan.outstanding_balance) }}</div>
        </div>
      </div>
    </div>
    <div class="collapse-content">
      <div class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label class="text-sm font-semibold text-base-content/70">Monto Aprobado</label>
          <div class="mt-1 font-mono">{{ formatCurrency(loan.approved_amount) }}</div>
        </div>
        <div>
          <label class="text-sm font-semibold text-base-content/70">Monto Desembolsado</label>
          <div class="mt-1 font-mono">{{ formatCurrency(loan.disbursed_amount) }}</div>
        </div>
        <div>
          <label class="text-sm font-semibold text-base-content/70">Saldo Pendiente</label>
          <div class="mt-1 font-mono font-bold">{{ formatCurrency(loan.outstanding_balance) }}</div>
        </div>
        <div>
          <label class="text-sm font-semibold text-base-content/70">Cuota Mensual</label>
          <div class="mt-1 font-mono">{{ formatCurrency(loan.monthly_payment_amount) }}</div>
        </div>
        <div>
          <label class="text-sm font-semibold text-base-content/70">Tasa de Interés</label>
          <div class="mt-1">{{ formatPercentage(loan.interest_rate, 2) }}</div>
        </div>
        <div>
          <label class="text-sm font-semibold text-base-content/70">Plazo</label>
          <div class="mt-1">{{ loan.term }} meses</div>
        </div>
        <div>
          <label class="text-sm font-semibold text-base-content/70">Fecha de Creación</label>
          <div class="mt-1">{{ formatDate(loan.creation_date) }}</div>
        </div>
        <div v-if="loan.guaranteed_stock_id" class="col-span-2">
          <label class="text-sm font-semibold text-base-content/70">Acción Garantizada</label>
          <div class="mt-1">
            <button class="btn btn-sm btn-link" @click="$emit('view-stock', loan.guaranteed_stock_id!)">
              Ver acción #{{ loan.guaranteed_stock_id }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="loan.outstanding_balance > 0" class="p-3 sm:p-4 bg-base-200 rounded-lg">
        <label class="text-sm font-semibold text-base-content/70 mb-2">Progreso de Pago</label>
        <div class="mb-2">
          <div class="flex justify-between items-center mb-1 text-xs text-base-content/70">
            <span>Pagado: {{ formatCurrency(getPaidAmount()) }} de {{ formatCurrency(loan.approved_amount) }}</span>
            <span>{{ Math.round((getPaidAmount() / loan.approved_amount) * 100) }}%</span>
          </div>
          <progress 
            class="progress progress-success w-full" 
            :value="getPaidAmount()" 
            :max="loan.approved_amount"
          ></progress>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 pt-2 border-t">
        <button class="btn btn-sm btn-primary" @click="$emit('pay', loan)">
          Pagar
        </button>
        <button class="btn btn-sm btn-outline" @click="$emit('pay-with-stock', loan)">
          Pagar con Acciones
        </button>
        <button class="btn btn-sm btn-outline" @click="$emit('view-schedule', loan)">
          Ver Cronograma
        </button>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatCurrency, formatDate, formatPercentage } from '@/shared/utils/formatters'
import type { Loan } from '@/api/members.api'

const props = withDefaults(
  defineProps<{
    loan: Loan
    expanded?: boolean
  }>(),
  {
    expanded: false
  }
)

const isExpanded = ref(props.expanded)

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

watch(() => props.expanded, (newValue) => {
  isExpanded.value = newValue
})

defineEmits<{
  pay: [loan: Loan]
  'pay-with-stock': [loan: Loan]
  'view-schedule': [loan: Loan]
  'view-stock': [stockId: string]
}>()

function getStatusVariant(status: string): string {
  switch (status) {
    case 'active':
      return 'success'
    case 'pending':
      return 'warning'
    case 'defaulted':
      return 'error'
    case 'paid':
    case 'closed':
      return 'success'
    default:
      return 'neutral'
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Activo',
    pending: 'Pendiente',
    paid: 'Pagado',
    defaulted: 'En mora',
    closed: 'Cerrado'
  }
  return labels[status] || status
}

function getPaidAmount(): number {
  return Math.max(0, props.loan.approved_amount - props.loan.outstanding_balance)
}
</script>


