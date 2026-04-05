<template>
  <div class="space-y-6">
    <LoadingSpinner :loading="loading" />
    <ErrorMessage :error="error" />

    <!-- Nota sobre notación -->
    <div class="text-xs text-base-content/60 text-center mb-2 hidden sm:block">
      * Notación americana: K = 1,000, M = 1,000,000, B = 1,000,000,000, T = 1,000,000,000,000
    </div>

    <!-- Tarjetas de Resumen -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <AccountSummaryCard
        title="Activos"
        :total="totals.activos"
        :icon="ArrowUp"
        icon-color="text-success"
        amount-color="text-success"
      />
      <AccountSummaryCard
        v-if="totals.pasivos > 0"
        title="Pasivos"
        :total="totals.pasivos"
        :icon="ArrowDown"
        icon-color="text-error"
        amount-color="text-error"
      />
      <AccountSummaryCard
        title="Patrimonio"
        :total="totals.patrimonio"
        :icon="Wallet"
        icon-color="text-primary"
        amount-color="text-primary"
      />
      <AccountSummaryCard
        title="Ingresos"
        :total="totals.ingresos"
        :icon="ArrowUp"
        icon-color="text-success"
        amount-color="text-success"
      />
      <AccountSummaryCard
        title="Gastos"
        :total="totals.gastos"
        :icon="Minus"
        icon-color="text-warning"
        amount-color="text-warning"
      />
    </div>

    <!-- Detalle por Categoría -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Activos -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <div class="flex items-center gap-2 mb-4">
            <ArrowUp class="w-5 h-5 text-success" />
            <h3 class="card-title">Activos</h3>
            <span class="text-success font-bold ml-auto">
              {{ formatCurrencyCompact(totals.activos) }}
            </span>
          </div>
          <div class="space-y-2">
            <div
              v-for="account in accountDetails.activos"
              :key="account.account_type"
              class="flex justify-between items-center p-2 bg-base-200 rounded"
            >
              <span class="text-sm">
                {{ getAccountLabel(account.account_type) }}
              </span>
              <span class="font-semibold text-success">
                {{ formatCurrency(Math.abs(account.total_balance)) }}
              </span>
            </div>
            <div v-if="accountDetails.activos.length === 0" class="text-sm text-base-content/60 text-center py-2">
              No hay cuentas de activos
            </div>
          </div>
        </div>
      </div>

      <!-- Pasivos -->
      <div v-if="totals.pasivos > 0" class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <div class="flex items-center gap-2 mb-4">
            <ArrowDown class="w-5 h-5 text-error" />
            <h3 class="card-title">Pasivos</h3>
            <span class="text-error font-bold ml-auto">
              {{ formatCurrencyCompact(totals.pasivos) }}
            </span>
          </div>
          <div class="space-y-2">
            <div v-if="accountDetails.pasivos.length === 0" class="text-sm text-base-content/60 text-center py-2">
              No hay cuentas de pasivos
            </div>
          </div>
        </div>
      </div>

      <!-- Patrimonio -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <div class="flex items-center gap-2 mb-4">
            <Wallet class="w-5 h-5 text-primary" />
            <h3 class="card-title">Patrimonio</h3>
            <span class="text-primary font-bold ml-auto">
              {{ formatCurrencyCompact(totals.patrimonio) }}
            </span>
          </div>
          <div class="space-y-2">
            <div
              v-for="account in accountDetails.patrimonio"
              :key="account.account_type"
              class="flex justify-between items-center p-2 bg-base-200 rounded"
            >
              <span class="text-sm">
                {{ getAccountLabel(account.account_type) }}
              </span>
              <span class="font-semibold text-primary">
                {{ formatCurrency(Math.abs(account.total_balance)) }}
              </span>
            </div>
            <div v-if="accountDetails.patrimonio.length === 0" class="text-sm text-base-content/60 text-center py-2">
              No hay cuentas de patrimonio
            </div>
          </div>
        </div>
      </div>

      <!-- Ingresos -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <div class="flex items-center gap-2 mb-4">
            <ArrowUp class="w-5 h-5 text-success" />
            <h3 class="card-title">Ingresos</h3>
            <span class="text-success font-bold ml-auto">
              {{ formatCurrencyCompact(totals.ingresos) }}
            </span>
          </div>
          <div class="space-y-2">
            <div
              v-for="account in accountDetails.ingresos"
              :key="account.account_type"
              class="flex justify-between items-center p-2 bg-base-200 rounded"
            >
              <span class="text-sm">
                {{ getAccountLabel(account.account_type) }}
              </span>
              <span class="font-semibold text-success">
                {{ formatCurrency(Math.abs(account.total_balance)) }}
              </span>
            </div>
            <div v-if="accountDetails.ingresos.length === 0" class="text-sm text-base-content/60 text-center py-2">
              No hay cuentas de ingresos
            </div>
          </div>
        </div>
      </div>

      <!-- Gastos -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <div class="flex items-center gap-2 mb-4">
            <Minus class="w-5 h-5 text-warning" />
            <h3 class="card-title">Gastos</h3>
            <span class="text-warning font-bold ml-auto">
              {{ formatCurrencyCompact(totals.gastos) }}
            </span>
          </div>
          <div class="space-y-2">
            <div
              v-for="account in accountDetails.gastos"
              :key="account.account_type"
              class="flex justify-between items-center p-2 bg-base-200 rounded"
            >
              <span class="text-sm">
                {{ getAccountLabel(account.account_type) }}
              </span>
              <span class="font-semibold text-warning">
                {{ formatCurrency(Math.abs(account.total_balance)) }}
              </span>
            </div>
            <div v-if="accountDetails.gastos.length === 0" class="text-sm text-base-content/60 text-center py-2">
              No hay cuentas de gastos
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowUp, ArrowDown, Wallet, Minus } from 'iconoir-vue/regular'
import { ledgerApi, type AccountSummary } from '@/api/ledger.api'
import { formatCurrency, formatCurrencyCompact } from '@/shared/utils/formatters'
import {
  ASSET_ACCOUNTS,
  EQUITY_ACCOUNTS,
  INCOME_ACCOUNTS,
  EXPENSE_ACCOUNTS,
  ACCOUNT_TYPE_LABELS,
  type AccountType
} from '../constants/account-types'
import AccountSummaryCard from './AccountSummaryCard.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'

const loading = ref(false)
const error = ref<string | null>(null)
const accountsSummary = ref<AccountSummary[]>([])

// Calcular totales por categoría
const totals = computed(() => {
  const calculateTotal = (accountTypes: AccountType[]) => {
    return accountsSummary.value
      .filter(acc => accountTypes.includes(acc.account_type as AccountType))
      .reduce((sum, acc) => sum + Math.abs(acc.total_balance), 0)
  }

  return {
    activos: calculateTotal(ASSET_ACCOUNTS),
    pasivos: 0, // No hay pasivos en el sistema actual
    patrimonio: calculateTotal(EQUITY_ACCOUNTS),
    ingresos: calculateTotal(INCOME_ACCOUNTS),
    gastos: calculateTotal(EXPENSE_ACCOUNTS)
  }
})

// Detalles por cuenta agrupados por categoría
const accountDetails = computed(() => {
  const getDetails = (accountTypes: AccountType[]) => {
    return accountsSummary.value
      .filter(acc => accountTypes.includes(acc.account_type as AccountType))
      .filter(acc => Math.abs(acc.total_balance) > 0)
  }

  return {
    activos: getDetails(ASSET_ACCOUNTS),
    pasivos: [] as AccountSummary[],
    patrimonio: getDetails(EQUITY_ACCOUNTS),
    ingresos: getDetails(INCOME_ACCOUNTS),
    gastos: getDetails(EXPENSE_ACCOUNTS)
  }
})

const getAccountLabel = (accountType: string) => {
  return ACCOUNT_TYPE_LABELS[accountType as AccountType] || accountType
}

async function fetchBalance() {
  loading.value = true
  error.value = null
  try {
    const response = await ledgerApi.getAccountsSummary()
    accountsSummary.value = response.accounts
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar el balance'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchBalance()
})

// Función de exportación
async function exportData() {
  const exportDataArray: Record<string, unknown>[] = []

  // Agregar resumen por categoría
  exportDataArray.push({
    Categoría: 'Activos',
    Total: totals.value.activos
  })
  if (totals.value.pasivos > 0) {
    exportDataArray.push({
      Categoría: 'Pasivos',
      Total: totals.value.pasivos
    })
  }
  exportDataArray.push({
    Categoría: 'Patrimonio',
    Total: totals.value.patrimonio
  })
  exportDataArray.push({
    Categoría: 'Ingresos',
    Total: totals.value.ingresos
  })
  exportDataArray.push({
    Categoría: 'Gastos',
    Total: totals.value.gastos
  })

  // Agregar detalles de cuentas
  exportDataArray.push({}) // Línea vacía
  exportDataArray.push({
    'Tipo de Cuenta': 'DETALLE DE CUENTAS',
    'Balance Total': '',
    'Débitos': '',
    'Créditos': ''
  })

  accountsSummary.value.forEach(account => {
    exportDataArray.push({
      'Tipo de Cuenta': getAccountLabel(account.account_type),
      'Balance Total': account.total_balance,
      'Débitos': account.total_debits,
      'Créditos': account.total_credits
    })
  })

  const { exportToCSV } = await import('@/shared/utils/export')
  exportToCSV(exportDataArray, `balance-${new Date().toISOString().split('T')[0]}`)
}

defineExpose({
  exportData
})
</script>
