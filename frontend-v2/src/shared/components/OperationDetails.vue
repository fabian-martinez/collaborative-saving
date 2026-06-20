<template>
  <div v-if="creditEntries && creditEntries.length > 0" class="space-y-3">
    <div 
      v-for="entry in creditEntries" 
      :key="entry.id || entry.account_type" 
      class="bg-base-100/50 p-2 rounded-md border border-base-300/30"
    >
      <!-- Título: account_type mapeado a español -->
      <div class="flex justify-between items-baseline mb-1">
        <span class="text-base-content/90 font-bold text-xs md:text-sm">
          {{ getAccountName(entry.account_type || '') || entry.account_type || 'Sin nombre' }}
        </span>
        <span 
          class="font-mono font-bold text-xs md:text-sm lg:text-base ml-2"
          :class="{
            'text-error': Number(entry.amount) < 0,
            'text-info': Number(entry.amount) > 0 && entry.account_type !== 'CASH',
            'text-success': entry.account_type === 'CASH' && Number(entry.amount) > 0
          }"
        >
          {{ formatCurrency(Math.abs(Number(entry.amount))) }}
        </span>
      </div>
      <!-- Mostrar descripción de la entrada siempre que exista -->
      <p v-if="entry.description && entry.description.trim()" class="text-[10px] md:text-xs text-base-content/70 mt-0.5 leading-relaxed wrap-break-word">
        {{ entry.description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '@/shared/utils/formatters'

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
  const operationType = props.operation.type
  const isStockPurchase = operationType === 'STOCK_PURCHASE'
  
  // Para compras de acciones (STOCK_PURCHASE):
  // - Mostrar CASH y LOANS_RECEIVABLE
  // - No mostrar STOCK_CAPITAL
  // Para otros tipos de operaciones (pagos mensuales, etc.):
  // - No mostrar CASH
  // - Mostrar todas las demás entradas
  
  return ledgerEntries.value.filter((e) => {
    const accountType = e.account_type
    
    if (isStockPurchase) {
      // En compras: mostrar solo CASH y LOANS_RECEIVABLE
      return accountType === 'CASH' || accountType === 'LOANS_RECEIVABLE'
    } else {
      // En otros tipos: excluir CASH, mostrar todo lo demás
      return accountType !== 'CASH'
    }
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

