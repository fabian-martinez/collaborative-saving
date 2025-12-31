<template>
  <div v-if="creditEntries && creditEntries.length > 0" class="space-y-3">
    <div 
      v-for="entry in creditEntries" 
      :key="entry.id || entry.account_type" 
      class="bg-base-100/50 p-3 rounded-md border border-base-300/30"
    >
      <!-- Título: account_type mapeado a español -->
      <div class="flex justify-between items-baseline mb-2">
        <span class="text-base-content/90 font-bold text-lg md:text-xl">
          {{ getAccountName(entry.account_type || '') || entry.account_type || 'Sin nombre' }}
        </span>
        <span class="font-mono text-error font-bold text-lg md:text-xl lg:text-2xl ml-2">
          {{ formatCurrency(Math.abs(Number(entry.amount))) }}
        </span>
      </div>
      <!-- Mostrar descripción de la entrada siempre que exista -->
      <p v-if="entry.description && entry.description.trim()" class="text-sm text-base-content/70 mt-1 leading-relaxed break-words">
        {{ entry.description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, formatDate } from '@/shared/utils/formatters'

interface LedgerEntry {
  id?: string
  operation_id?: string
  account_type: string
  amount: number | string
  created_at?: string | Date
  description?: string
}

interface Operation {
  id?: string
  meeting_id?: string
  member_id?: string
  type: string
  date: string | Date
  description?: string
  ledger_entries?: LedgerEntry[]
}

const props = defineProps<{
  operation: Operation
}>()

const ledgerEntries = computed(() => {
  return props.operation.ledger_entries || []
})

const creditEntries = computed(() => {
  // Mostrar solo las salidas (créditos - valores negativos), excluyendo CASH
  // Los valores negativos se muestran como positivos (sin signo)
  return ledgerEntries.value.filter((e) => {
    const accountType = e.account_type
    const amount = Number(e.amount) || 0
    // Excluir CASH y mostrar solo salidas (valores negativos)
    return accountType !== 'CASH' && amount < 0
  })
})

const accountNames: Record<string, string> = {
  CASH: 'Caja',
  LOANS_RECEIVABLE: 'Préstamos por Cobrar',
  STOCK_CAPITAL: 'Capital Social (Acciones)',
  INTEREST_INCOME: 'Ingresos por Intereses',
  FEE_INCOME: 'Ingresos por Otros',
  INSURANCE_INCOME: 'Ingresos por Seguro',
  MANDATORY_CONTRIBUTION_INCOME: 'Aportes Obligatorios',
  MONTHLY_PAYMENT: 'Cuota Mensual',
  NOVELTY_LOSS: 'Pérdida por Novedad',
  LOAN_PORTFOLIO: 'Cartera de Préstamos',
  STOCK_PORTFOLIO: 'Cartera de Acciones',
  MANDATORY_CONTRIBUTIONS: 'Aportes Obligatorios',
  ACCUMULATED_SURPLUS: 'Superávit Acumulado',
  // Tipos que vienen del API en snake_case
  mandatory_contribution: 'Aportes Obligatorios',
  loan_payment: 'Pago de Préstamo',
  stock_fee: 'Cuota de Acción',
  fee: 'Otro Aporte',
  insurance: 'Seguro de Deuda',
  novelty: 'Novedad',
  // Tipos en UPPER_CASE también
  MANDATORY_CONTRIBUTION: 'Aportes Obligatorios',
  LOAN_PAYMENT: 'Pago de Préstamo',
  STOCK_FEE: 'Cuota de Acción',
  FEE: 'Otro Aporte',
  INSURANCE: 'Seguro de Deuda',
  NOVELTY: 'Novedad',
}

const getAccountName = (accountKey: string) => {
  if (!accountKey) return ''
  return accountNames[accountKey] || accountKey
}
</script>

