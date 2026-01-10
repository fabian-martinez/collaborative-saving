<template>
  <ExpandableSection :title="`Préstamo ${loan.loan_type} - ${formatCurrency(loan.approved_amount)}`" :default-expanded="expanded">
    <template #header>
      <div class="flex items-center justify-between w-full pr-4">
        <div class="flex items-center gap-3">
          <span class="font-semibold">{{ loan.loan_type }}</span>
          <Badge :variant="getStatusVariant(loan.status)">
            {{ getStatusLabel(loan.status) }}
          </Badge>
        </div>
        <div class="text-right">
          <div class="text-sm text-gray-600">Saldo Pendiente</div>
          <div class="text-lg font-bold font-mono">{{ formatCurrency(loan.outstanding_balance) }}</div>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label class="text-sm font-semibold text-gray-600">Monto Aprobado</label>
          <div class="mt-1 font-mono">{{ formatCurrency(loan.approved_amount) }}</div>
        </div>
        <div>
          <label class="text-sm font-semibold text-gray-600">Monto Desembolsado</label>
          <div class="mt-1 font-mono">{{ formatCurrency(loan.disbursed_amount) }}</div>
        </div>
        <div>
          <label class="text-sm font-semibold text-gray-600">Saldo Pendiente</label>
          <div class="mt-1 font-mono font-bold">{{ formatCurrency(loan.outstanding_balance) }}</div>
        </div>
        <div>
          <label class="text-sm font-semibold text-gray-600">Cuota Mensual</label>
          <div class="mt-1 font-mono">{{ formatCurrency(loan.monthly_payment_amount) }}</div>
        </div>
        <div>
          <label class="text-sm font-semibold text-gray-600">Tasa de Interés</label>
          <div class="mt-1">{{ formatPercentage(loan.interest_rate, 2) }}</div>
        </div>
        <div>
          <label class="text-sm font-semibold text-gray-600">Plazo</label>
          <div class="mt-1">{{ loan.term }} meses</div>
        </div>
        <div>
          <label class="text-sm font-semibold text-gray-600">Fecha de Creación</label>
          <div class="mt-1">{{ formatDate(loan.creation_date) }}</div>
        </div>
        <div v-if="loan.guaranteed_stock_id" class="col-span-2">
          <label class="text-sm font-semibold text-gray-600">Acción Garantizada</label>
          <div class="mt-1">
            <button class="btn btn-sm btn-link" @click="$emit('view-stock', loan.guaranteed_stock_id!)">
              Ver acción #{{ loan.guaranteed_stock_id }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="loan.outstanding_balance > 0" class="progress-section">
        <label class="text-sm font-semibold text-gray-600 mb-2">Progreso de Pago</label>
        <ProgressBar
          :value="getPaidAmount()"
          :max="loan.approved_amount"
          :label="`Pagado: ${formatCurrency(getPaidAmount())} de ${formatCurrency(loan.approved_amount)}`"
          variant="success"
        />
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
  </ExpandableSection>
</template>

<script setup lang="ts">
import ExpandableSection from '@/shared/components/ExpandableSection.vue'
import Badge from '@/shared/components/Badge.vue'
import ProgressBar from '@/shared/components/ProgressBar.vue'
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

const emit = defineEmits<{
  pay: [loan: Loan]
  'pay-with-stock': [loan: Loan]
  'view-schedule': [loan: Loan]
  'view-stock': [stockId: string]
}>()

function getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'neutral' {
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

<style scoped>
.progress-section {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}
</style>

