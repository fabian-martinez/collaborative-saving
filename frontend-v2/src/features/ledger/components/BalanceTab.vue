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

    <!-- Filtros -->
    <div class="flex flex-col md:flex-row gap-4 mt-6">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar por cuenta original o nombre..."
        class="input input-bordered flex-1"
      />
      <select v-model="selectedCategory" class="select select-bordered">
        <option value="">Todas las categorías</option>
        <option value="Activo">Activos</option>
        <option value="Pasivo">Pasivos</option>
        <option value="Patrimonio">Patrimonio</option>
        <option value="Ingreso">Ingresos</option>
        <option value="Gasto">Gastos</option>
      </select>
    </div>

    <!-- Balance de Comprobación -->
    <div class="card bg-base-100 shadow-lg mt-6">
      <div class="card-body">
        <h3 class="card-title mb-4">Balance de Comprobación</h3>
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>CUENTA</th>
                <th>CATEGORÍA</th>
                <th class="text-right">DÉBITOS</th>
                <th class="text-right">CRÉDITOS</th>
                <th class="text-right">SALDO NETO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="account in filteredAccounts" :key="account.account_type">
                <td>
                  <router-link 
                    :to="{ name: 'account-detail', params: { accountId: account.account_type } }"
                    class="font-medium hover:text-primary hover:underline transition-colors block"
                  >
                    {{ getAccountLabel(account.account_type) }}
                  </router-link>
                  <div class="text-xs text-base-content/60 font-mono mt-1">{{ account.account_type }}</div>
                </td>
                <td>
                  <span class="badge" :class="getCategoryColor(getAccountCategory(account.account_type))">
                    {{ getAccountCategory(account.account_type) }}
                  </span>
                </td>
                <td class="text-right">{{ formatCurrency(account.total_debits) }}</td>
                <td class="text-right">{{ formatCurrency(account.total_credits) }}</td>
                <td class="text-right font-semibold" :class="getBalanceColor(account)">
                  {{ formatCurrency(Math.abs(account.total_balance)) }}
                </td>
              </tr>
              <tr v-if="filteredAccounts.length === 0">
                <td colspan="5" class="text-center py-8 text-base-content/60">
                  No se encontraron cuentas con los filtros actuales
                </td>
              </tr>
            </tbody>
            <tfoot v-if="filteredAccounts.length > 0">
              <tr class="font-bold bg-base-200">
                <td colspan="2" class="text-right">TOTALES</td>
                <td class="text-right">{{ formatCurrency(totalDebits) }}</td>
                <td class="text-right">{{ formatCurrency(totalCredits) }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowUp, ArrowDown, Wallet, Minus } from 'iconoir-vue/regular'
import { ledgerApi, type AccountSummary } from '@/api/ledger.api'
import { formatCurrency } from '@/shared/utils/formatters'
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
const searchQuery = ref('')
const selectedCategory = ref('')

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



const getAccountLabel = (accountType: string) => {
  return ACCOUNT_TYPE_LABELS[accountType as AccountType] || accountType
}

const filteredAccounts = computed(() => {
  return accountsSummary.value.filter(account => {
    const matchesSearch = getAccountLabel(account.account_type).toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                          account.account_type.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === '' || getAccountCategory(account.account_type) === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

const totalDebits = computed(() => filteredAccounts.value.reduce((sum, acc) => sum + acc.total_debits, 0))
const totalCredits = computed(() => filteredAccounts.value.reduce((sum, acc) => sum + acc.total_credits, 0))

const getAccountCategory = (accountType: string) => {
  const type = accountType as AccountType
  if (ASSET_ACCOUNTS.includes(type)) return 'Activo'
  if (EQUITY_ACCOUNTS.includes(type)) return 'Patrimonio'
  if (INCOME_ACCOUNTS.includes(type)) return 'Ingreso'
  if (EXPENSE_ACCOUNTS.includes(type)) return 'Gasto'
  return 'Otro'
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Activo': return 'badge-success badge-outline'
    case 'Patrimonio': return 'badge-primary badge-outline'
    case 'Ingreso': return 'badge-success badge-outline'
    case 'Gasto': return 'badge-warning badge-outline'
    default: return 'badge-ghost badge-outline'
  }
}

const getBalanceColor = (account: AccountSummary) => {
  const category = getAccountCategory(account.account_type)
  if (category === 'Activo' || category === 'Ingreso') {
    return 'text-success'
  }
  if (category === 'Patrimonio') {
    return 'text-primary'
  }
  if (category === 'Gasto') {
    return 'text-warning'
  }
  return ''
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

