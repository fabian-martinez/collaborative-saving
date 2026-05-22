<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4 border-b pb-4">
      <button class="btn btn-circle btn-sm btn-ghost" @click="router.back()">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          {{ accountLabel }}
          <span class="badge badge-lg" :class="categoryColor">{{ categoryName }}</span>
        </h1>
        <p class="text-sm text-base-content/60 font-mono mt-1 flex items-center gap-2">
          Cuenta: {{ accountId }} | Resumen Anual
          <select v-model="selectedYear" class="select select-bordered select-sm min-w-[80px]">
            <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
          </select>
        </p>
      </div>
    </div>

    <LoadingSpinner :loading="loading" />
    <ErrorMessage :error="error" />

    <div v-if="!loading && !error">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="card bg-base-100 shadow-sm border">
          <div class="card-body p-4 flex flex-row items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-base-content/70">Total Debe (Año)</h3>
              <p class="text-xl font-bold text-success">{{ formatCurrency(yearlyTotalDebe) }}</p>
            </div>
            <ArrowUp class="w-8 h-8 text-success opacity-50" />
          </div>
        </div>
        <div class="card bg-base-100 shadow-sm border">
          <div class="card-body p-4 flex flex-row items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-base-content/70">Total Haber (Año)</h3>
              <p class="text-xl font-bold text-error">{{ formatCurrency(yearlyTotalHaber) }}</p>
            </div>
            <ArrowDown class="w-8 h-8 text-error opacity-50" />
          </div>
        </div>
        <div class="card bg-base-100 shadow-sm border">
          <div class="card-body p-4 flex flex-row items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-base-content/70">Saldo Neto</h3>
              <p class="text-xl font-bold" :class="getBalanceColor()">
                {{ formatCurrency(Math.abs(yearlyNetBalance)) }}
              </p>
            </div>
            <Wallet class="w-8 h-8 opacity-50" />
          </div>
        </div>
      </div>

      <!-- Chart Card -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-center block mb-2">Evolución Mensual (Debe vs Haber)</h2>
          <p class="text-xs text-base-content/60 text-center mb-6">Haz clic en un mes para ver el detalle de transacciones</p>
          
          <div class="h-[400px] w-full relative">
            <Bar
              v-if="chartData"
              :data="chartData"
              :options="chartOptions"
            />
          </div>
        </div>
      </div>
    </div>

    <AccountMonthDetailModal
      v-if="selectedMonthData"
      :is-open="isModalOpen"
      :month-label="selectedMonthData.monthLabel"
      :account-label="accountLabel"
      :entries="selectedMonthData.entries"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowUp, ArrowDown, Wallet } from 'iconoir-vue/regular'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import { ledgerApi, type LedgerEntry } from '@/api/ledger.api'
import { formatCurrency } from '@/shared/utils/formatters'
import {
  ASSET_ACCOUNTS,
  EQUITY_ACCOUNTS,
  INCOME_ACCOUNTS,
  EXPENSE_ACCOUNTS,
  ACCOUNT_TYPE_LABELS,
  type AccountType
} from '../constants/account-types'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import AccountMonthDetailModal from '../components/AccountMonthDetailModal.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const route = useRoute()
const router = useRouter()
const accountId = computed(() => route.params.accountId as string)

const loading = ref(false)
const error = ref<string | null>(null)
const entries = ref<LedgerEntry[]>([])

const selectedYear = ref(new Date().getFullYear())

const availableYears = computed(() => {
  const years = new Set(entries.value.map(e => new Date(e.created_at).getFullYear()))
  years.add(new Date().getFullYear())
  return Array.from(years).sort((a, b) => b - a)
})

const isModalOpen = ref(false)
const selectedMonthData = ref<{ monthLabel: string, entries: LedgerEntry[] } | null>(null)

// --- Meta info ---
const accountLabel = computed(() => ACCOUNT_TYPE_LABELS[accountId.value as AccountType] || accountId.value)

const categoryName = computed(() => {
  const type = accountId.value as AccountType
  if (ASSET_ACCOUNTS.includes(type)) return 'Activo'
  if (EQUITY_ACCOUNTS.includes(type)) return 'Patrimonio'
  if (INCOME_ACCOUNTS.includes(type)) return 'Ingreso'
  if (EXPENSE_ACCOUNTS.includes(type)) return 'Gasto'
  return 'Otro'
})

const categoryColor = computed(() => {
  switch (categoryName.value) {
    case 'Activo': return 'badge-success badge-outline'
    case 'Patrimonio': return 'badge-primary badge-outline'
    case 'Ingreso': return 'badge-success badge-outline'
    case 'Gasto': return 'badge-warning badge-outline'
    default: return 'badge-ghost badge-outline'
  }
})

function getBalanceColor() {
  const cat = categoryName.value
  if (cat === 'Activo' || cat === 'Ingreso') return 'text-success'
  if (cat === 'Patrimonio') return 'text-primary'
  if (cat === 'Gasto') return 'text-warning'
  return ''
}

// --- Totales Anuales ---
const entriesForYear = computed(() => entries.value.filter(e => new Date(e.created_at).getFullYear() === selectedYear.value))
const yearlyTotalDebe = computed(() => entriesForYear.value.filter(e => e.amount > 0).reduce((acc, e) => acc + e.amount, 0))
const yearlyTotalHaber = computed(() => entriesForYear.value.filter(e => e.amount < 0).reduce((acc, e) => acc + Math.abs(e.amount), 0))
const yearlyNetBalance = computed(() => yearlyTotalDebe.value - yearlyTotalHaber.value)

// --- Agrupación por Mes ---
const MONTH_NAMES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
]

const monthlyData = computed(() => {
  const data = Array(12).fill(0).map((_, i) => ({
    monthIdx: i,
    label: MONTH_NAMES[i],
    debe: 0,
    haber: 0,
    entries: [] as LedgerEntry[]
  }))

  entries.value.forEach(entry => {
    const date = new Date(entry.created_at)
    if (date.getFullYear() === selectedYear.value) {
      const m = date.getMonth()
      data[m].entries.push(entry)
      if (entry.amount > 0) {
        data[m].debe += entry.amount
      } else {
        data[m].haber += Math.abs(entry.amount)
      }
    }
  })

  return data
})

const chartData = computed(() => {
  return {
    labels: monthlyData.value.map(d => d.label),
    datasets: [
      {
        label: 'Debe',
        backgroundColor: '#0a3d70', // Azul oscuro
        data: monthlyData.value.map(d => d.debe),
        borderRadius: 4
      },
      {
        label: 'Haber',
        backgroundColor: '#5dbcf3', // Azul claro
        data: monthlyData.value.map(d => d.haber),
        borderRadius: 4
      }
    ]
  }
})

const chartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_event: any, elements: any[]) => {
      if (elements && elements.length > 0) {
        const index = elements[0].index
        openModalForMonth(index)
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            // Formatear el eje Y como moneda simplificada
            return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
          }
        }
      }
    }
  }
})

function openModalForMonth(monthIndex: number) {
  const data = monthlyData.value[monthIndex]
  selectedMonthData.value = {
    monthLabel: `${data.label} ${selectedYear.value}`,
    entries: data.entries
  }
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

async function fetchData() {
  loading.value = true
  error.value = null
  try {
    // Pedimos hasta 10000 entradas para no paginar en el frontend y agrupar todo el año
    const response = await ledgerApi.getLedgerEntries({
      account_type: accountId.value,
      limit: 10000,
      order_by: 'ASC'
    })
    entries.value = response.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar detalles de la cuenta'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
