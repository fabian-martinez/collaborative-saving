<template>
  <div class="container mx-auto p-4 md:p-6 max-w-7xl">
    <div class="flex items-center gap-4 mb-6">
      <button aria-label="Volver" @click="router.back()" class="btn btn-circle btn-ghost">
        <ArrowLeft class="w-6 h-6" />
      </button>
      <h1 class="text-2xl font-bold text-base-content m-0 flex-1">Detalle de Préstamo</h1>
      <button v-if="loan" @click="openUpdateModal" class="btn btn-primary btn-sm">
        <Edit class="w-4 h-4 mr-1" />
        Actualizar Crédito
      </button>
    </div>

    <LoadingSpinner :loading="loading" class="p-8" />
    <ErrorMessage :error="error" class="m-4" />

    <div v-if="loan && !loading && !error" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Resumen General -->
      <div class="col-span-1 lg:col-span-2">
        <div class="card bg-base-100 shadow-sm border border-base-200 h-full">
          <div class="card-body">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div>
                <h2 class="card-title text-xl mb-1">Préstamo {{ loan.loan_type }}</h2>
                <p class="text-sm text-base-content/70">ID: {{ loan.id }}</p>
              </div>
              <div class="mt-2 md:mt-0">
                <span :class="getStatusBadgeClass(loan.status)" class="badge badge-lg">{{ loan.status }}</span>
              </div>
            </div>

            <!-- Progreso de pago -->
            <div class="mt-4 mb-6">
              <div class="flex justify-between text-sm mb-1">
                <span>Progreso de Pago</span>
                <span class="font-medium">{{ formatPercentage(paymentProgress / 100) }}</span>
              </div>
              <progress class="progress progress-primary w-full" :value="paymentProgress" max="100"></progress>
              <div class="flex justify-between text-xs text-base-content/70 mt-1">
                <span>Pagado: {{ formatCurrency(paidAmount) }}</span>
                <span>Pendiente: {{ formatCurrency(loan.outstanding_balance) }}</span>
              </div>
            </div>

            <!-- Datos Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div class="bg-base-200/50 p-3 rounded-lg flex flex-col justify-center">
                <div class="text-xs text-base-content/70">Miembro</div>
                <div class="font-medium truncate" :title="loan.member_id">{{ loan.member_id }}</div>
              </div>
              <div class="bg-base-200/50 p-3 rounded-lg flex flex-col justify-center">
                <div class="text-xs text-base-content/70">Monto Aprobado</div>
                <div class="font-medium">{{ formatCurrency(loan.approved_amount) }}</div>
              </div>
              <div class="bg-base-200/50 p-3 rounded-lg flex flex-col justify-center">
                <div class="text-xs text-base-content/70">Monto Desembolsado</div>
                <div class="font-medium">{{ formatCurrency(loan.disbursed_amount) }}</div>
              </div>
              <div class="bg-base-200/50 p-3 rounded-lg flex flex-col justify-center">
                <div class="text-xs text-base-content/70">Tasa de Interés</div>
                <div class="font-medium">{{ formatPercentage(loan.interest_rate) }}</div>
              </div>
              <div class="bg-base-200/50 p-3 rounded-lg flex flex-col justify-center">
                <div class="text-xs text-base-content/70">Plazo</div>
                <div class="font-medium">{{ loan.term }} meses</div>
              </div>
              <div class="bg-base-200/50 p-3 rounded-lg flex flex-col justify-center">
                <div class="text-xs text-base-content/70">Cuota Mensual</div>
                <div class="font-medium">{{ formatCurrency(loan.monthly_payment_amount) }}</div>
              </div>
              <div class="bg-base-200/50 p-3 rounded-lg flex flex-col justify-center">
                <div class="text-xs text-base-content/70">Fecha de Creación</div>
                <div class="font-medium">{{ formatDate(loan.creation_date) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráfica de Amortización -->
      <div class="col-span-1">
        <div class="card bg-base-100 shadow-sm border border-base-200 h-full">
          <div class="card-body flex flex-col">
            <h3 class="card-title text-lg mb-2">Histórico de Pagos</h3>
            <div class="flex-1 min-h-[220px] relative">
              <LoadingSpinner :loading="loadingChartData" class="absolute inset-0 flex items-center justify-center" />
              <Bar v-if="chartData && !loadingChartData" :data="chartData" :options="chartOptions" />
              <div v-else-if="!loadingChartData" class="absolute inset-0 flex items-center justify-center text-sm text-base-content/50">
                No hay pagos registrados para graficar.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Historial de Pagos -->
      <div class="col-span-1 lg:col-span-3 mt-4">
        <h3 class="text-xl font-semibold mb-4">Historial de Pagos</h3>
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body p-0 overflow-hidden">
            <LoadingSpinner :loading="loadingHistory" class="p-8" />
            <ErrorMessage :error="historyError" class="m-4" />
            
            <DataTable
              v-if="!loadingHistory && !historyError && transactions.length > 0"
              :data="transactions"
              :columns="transactionColumns"
              row-key="id"
              empty-message="No hay transacciones registradas para este préstamo"
            >
              <template #cell-transaction_type="{ value }">
                <span class="font-medium text-base-content">
                  {{ formatTransactionType(String(value)) }}
                </span>
              </template>
            </DataTable>
            <div v-else-if="!loadingHistory && !historyError" class="p-8 text-center text-base-content/60">
              No hay transacciones registradas para este préstamo.
            </div>

            <!-- Paginación -->
            <div class="p-4 border-t border-base-200 flex justify-end" v-if="transactionsTotal > 0">
              <Pagination
                :page="page"
                :total-pages="totalPages"
                :total="transactionsTotal"
                :start-index="(page - 1) * limit + 1"
                :end-index="Math.min(page * limit, transactionsTotal)"
                @page-change="handlePageChange"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Actualizar Crédito -->
    <dialog ref="updateModal" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Actualizar Condiciones del Crédito</h3>
        
        <form @submit.prevent="submitUpdate" v-if="loan">
          <div class="form-control w-full mb-4">
            <label class="label"><span class="label-text">Tasa de Interés (Ej: 0.02 para 2%)</span></label>
            <input v-model.number="updateForm.interest_rate" type="number" step="0.001" min="0" class="input input-bordered w-full" required />
          </div>
          
          <div class="form-control w-full mb-4">
            <label class="label"><span class="label-text">Plazo (meses)</span></label>
            <input v-model.number="updateForm.term" type="number" min="1" class="input input-bordered w-full" required />
          </div>
          
          <div class="form-control w-full mb-6">
            <label class="label"><span class="label-text">Cuota Mensual Estimada</span></label>
            <input v-model.number="updateForm.monthly_payment_amount" type="number" min="0" class="input input-bordered w-full" required />
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="closeUpdateModal" :disabled="updating">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="updating">
              <span v-if="updating" class="loading loading-spinner loading-xs"></span>
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button aria-label="Cerrar modal">close</button>
      </form>
    </dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Edit } from 'iconoir-vue/regular'
import { loansApi, type Loan, type LoanTransaction } from '@/api/loans.api'
import { formatCurrency, formatPercentage, formatDate } from '@/shared/utils/formatters'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import DataTable, { type Column } from '@/shared/components/DataTable.vue'
import Pagination from '@/shared/components/Pagination.vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const route = useRoute()
const router = useRouter()
const loan = ref<Loan | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Payment History State
const transactions = ref<LoanTransaction[]>([])
const loadingHistory = ref(false)
const historyError = ref<string | null>(null)
const page = ref(1)
const limit = ref(10)
const transactionsTotal = ref(0)
const totalPages = computed(() => Math.ceil(transactionsTotal.value / limit.value))

// Chart State
const allTransactions = ref<LoanTransaction[]>([])
const loadingChartData = ref(false)

const chartData = computed(() => {
  if (!loan.value || allTransactions.value.length === 0) return null

  // Filtrar solo pagos de capital e intereses
  const payments = allTransactions.value.filter(
    tx => tx.transaction_type === 'principal_payment' || tx.transaction_type === 'interest_payment'
  )

  if (payments.length === 0) return null

  // Agrupar por operation_id (o por id si no tiene operation_id) para mantener las operaciones separadas
  const groups: Record<string, { date: Date; principal: number; interest: number }> = {}

  payments.forEach((tx) => {
    const key = tx.operation_id || tx.id
    if (!groups[key]) {
      groups[key] = {
        date: new Date(tx.transaction_date),
        principal: 0,
        interest: 0
      }
    }
    if (tx.transaction_type === 'principal_payment') {
      groups[key].principal += tx.amount
    } else if (tx.transaction_type === 'interest_payment') {
      groups[key].interest += tx.amount
    }
  })

  // Ordenar las operaciones cronológicamente
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    return groups[a].date.getTime() - groups[b].date.getTime()
  })

  // Contar ocurrencias de cada fecha formateada para detectar duplicados
  const dateCounts: Record<string, number> = {}
  const dateIndices: Record<string, number> = {}

  sortedKeys.forEach((key) => {
    const formattedDate = formatDate(groups[key].date)
    dateCounts[formattedDate] = (dateCounts[formattedDate] || 0) + 1
  })

  // Generar etiquetas únicas de fecha
  const labels = sortedKeys.map((key) => {
    const formattedDate = formatDate(groups[key].date)
    if (dateCounts[formattedDate] > 1) {
      dateIndices[formattedDate] = (dateIndices[formattedDate] || 0) + 1
      return `${formattedDate} (#${dateIndices[formattedDate]})`
    }
    return formattedDate
  })

  const principalData = sortedKeys.map(key => groups[key].principal)
  const interestData = sortedKeys.map(key => groups[key].interest)

  return {
    labels,
    datasets: [
      {
        label: 'Abono a Capital',
        backgroundColor: '#6366f1',
        hoverBackgroundColor: '#4f46e5',
        data: principalData,
        borderRadius: 4
      },
      {
        label: 'Pago de Intereses',
        backgroundColor: '#a5b4fc',
        hoverBackgroundColor: '#818cf8',
        data: interestData,
        borderRadius: 4
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        color: '#64748b',
        boxWidth: 12
      }
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          return ` ${context.dataset.label}: ${formatCurrency(context.raw)}`
        }
      }
    }
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false
      }
    },
    y: {
      stacked: true,
      ticks: {
        callback: (value: any) => {
          return formatCurrency(value)
        }
      }
    }
  }
}

// Update Modal State
const updateModal = ref<HTMLDialogElement | null>(null)
const updating = ref(false)
const updateForm = ref({
  interest_rate: 0,
  term: 0,
  monthly_payment_amount: 0
})

const transactionColumns: Column[] = [
  { key: 'transaction_date', label: 'Fecha', format: 'date' },
  { key: 'transaction_type', label: 'Concepto' },
  { key: 'amount', label: 'Monto', format: 'currency' },
  { key: 'notes', label: 'Notas' }
]

const paidAmount = computed(() => {
  if (!loan.value) return 0
  return loan.value.approved_amount - loan.value.outstanding_balance
})

const paymentProgress = computed(() => {
  if (!loan.value || loan.value.approved_amount === 0) return 0
  return Math.min(100, Math.max(0, (paidAmount.value / loan.value.approved_amount) * 100))
})

function getStatusBadgeClass(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
    case 'activo':
      return 'badge-success'
    case 'pending':
    case 'pendiente':
      return 'badge-warning'
    case 'paid':
    case 'pagado':
      return 'badge-info'
    default:
      return 'badge-ghost'
  }
}

function formatTransactionType(type: string) {
  switch (type) {
    case 'disbursement':
      return 'Desembolso'
    case 'principal_payment':
      return 'Abono a Capital'
    case 'interest_payment':
      return 'Pago de Intereses'
    default:
      return type
  }
}

async function loadTransactionHistory() {
  if (!loan.value) return
  loadingHistory.value = true
  historyError.value = null
  try {
    const result = await loansApi.getLoanTransactions(loan.value.id, {
      page: page.value,
      limit: limit.value
    })
    transactions.value = result.data
    transactionsTotal.value = result.total
  } catch (e) {
    historyError.value = 'No se pudo cargar el historial de pagos del préstamo'
  } finally {
    loadingHistory.value = false
  }
}

async function loadAllTransactionsForChart() {
  if (!loan.value) return
  loadingChartData.value = true
  try {
    const result = await loansApi.getLoanTransactions(loan.value.id, {
      page: 1,
      limit: 1000
    })
    allTransactions.value = result.data
  } catch (e) {
    console.error('Error al cargar transacciones para el gráfico:', e)
  } finally {
    loadingChartData.value = false
  }
}

function handlePageChange(newPage: number) {
  page.value = newPage
  loadTransactionHistory()
}

async function loadLoan() {
  loading.value = true
  error.value = null
  try {
    loan.value = await loansApi.getLoanById(route.params.id as string)
    await Promise.all([
      loadTransactionHistory(),
      loadAllTransactionsForChart()
    ])
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar préstamo'
  } finally {
    loading.value = false
  }
}

function openUpdateModal() {
  if (!loan.value) return
  updateForm.value = {
    interest_rate: loan.value.interest_rate,
    term: loan.value.term,
    monthly_payment_amount: loan.value.monthly_payment_amount
  }
  updateModal.value?.showModal()
}

function closeUpdateModal() {
  updateModal.value?.close()
}

async function submitUpdate() {
  if (!loan.value) return
  updating.value = true
  try {
    await loansApi.updateLoanTerms(loan.value.id, {
      interest_rate: updateForm.value.interest_rate,
      term: updateForm.value.term,
      monthly_payment_amount: updateForm.value.monthly_payment_amount
    })
    closeUpdateModal()
    // Reload loan to get fresh data
    await loadLoan()
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Error al actualizar el crédito')
  } finally {
    updating.value = false
  }
}

onMounted(() => {
  loadLoan()
})
</script>


