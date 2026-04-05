<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Line, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { useDashboardStore } from '../stores/dashboard'
import MetricCard from '../components/MetricCard.vue'
import ActivityItem from '../components/ActivityItem.vue'
import QuickActionButton from '../components/QuickActionButton.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import {
  User,
  Eye,
  Wallet,
  Plus,
  Bank
} from 'iconoir-vue/regular'
import { formatCurrency } from '@/shared/utils/formatters'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const router = useRouter()
const store = useDashboardStore()

onMounted(() => {
  store.fetchDashboardData()
})

const lineChartData = computed(() => {
  if (!store.monthlyMovements) return null
  return {
    labels: store.monthlyMovements.labels,
    datasets: [
      {
        label: 'Recaudado',
        data: store.monthlyMovements.collected,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Desembolsado',
        data: store.monthlyMovements.disbursed,
        borderColor: 'rgb(147, 197, 253)',
        backgroundColor: 'rgba(147, 197, 253, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }
})

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function (tickValue: string | number) {
          const value = typeof tickValue === 'number' ? tickValue : Number(tickValue)
          return '$' + (value / 1000000).toFixed(1) + 'M'
        }
      }
    }
  }
}

const doughnutChartData = computed(() => {
  if (!store.portfolioStatus) return null
  return {
    labels: ['Al día', 'En mora', 'Castigado'],
    datasets: [
      {
        data: [
          store.portfolioStatus.up_to_date,
          store.portfolioStatus.overdue,
          store.portfolioStatus.written_off
        ],
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(251, 146, 60)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 0
      }
    ]
  }
})

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const
    }
  }
}

function handleStartMeeting() {
  router.push('/meetings/active')
}

function handleNewMember() {
  router.push('/members')
}

function handleNewStock() {
  router.push('/stocks')
}

function handleNewLoan() {
  router.push('/loans')
}

function handleRegisterPayment() {
  router.push('/meetings/active')
}

const nextMeetingDate = computed(() => {
  if (!store.nextMeeting) return ''
  const date = new Date(store.nextMeeting.date)
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(date)
})
</script>

<template>
  <div class="space-y-6">
    <LoadingSpinner :loading="store.loading" />
    <ErrorMessage :error="store.error" />

    <!-- Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard
        v-if="store.metrics"
        title="Socios Activos"
        :value="store.metrics.active_members.count"
        :subtitle="`de ${store.metrics.active_members.total} totales`"
        :change-percent="store.metrics.active_members.change_percent"
        :icon="User"
      />
      <MetricCard
        v-if="store.metrics"
        title="Total Acciones"
        :value="store.metrics.total_stocks.count"
        :subtitle="formatCurrency(store.metrics.total_stocks.value)"
        :change-percent="store.metrics.total_stocks.change_percent"
        :icon="Eye"
      />
      <MetricCard
        v-if="store.metrics"
        title="Préstamos Activos"
        :value="store.metrics.active_loans.count"
        subtitle="En cartera"
        :icon="Bank"
      />
      <MetricCard
        v-if="store.metrics"
        title="Cartera Total"
        :value="formatCurrency(store.metrics.total_portfolio.value)"
        bg-color="primary"
      />
      <MetricCard
        v-if="store.metrics"
        title="Cartera en Mora"
        :value="formatCurrency(store.metrics.overdue_portfolio.value)"
        :subtitle="`${store.metrics.overdue_portfolio.percent_of_total}% del total`"
        bg-color="warning"
      />
      <MetricCard
        v-if="store.metrics"
        title="Recaudado (Mes)"
        :value="formatCurrency(store.metrics.monthly_collected.value)"
        :change-percent="store.metrics.monthly_collected.change_percent"
        :icon="Wallet"
      />
    </div>

    <!-- Charts and Next Meeting Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Monthly Movements Chart -->
      <div class="lg:col-span-2 card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title">Movimientos Mensuales</h2>
          <p class="text-sm text-base-content/60 mb-4">Recaudos vs Desembolsos</p>
          <div v-if="lineChartData" style="height: 300px;">
            <Line :data="lineChartData" :options="lineChartOptions" />
          </div>
        </div>
      </div>

      <!-- Next Meeting Card -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title">Próxima Reunión</h2>
          <div v-if="store.nextMeeting" class="space-y-4">
            <div>
              <p class="text-2xl font-bold">Reunión #{{ store.nextMeeting.number }}</p>
              <p class="text-sm text-base-content/60 mt-1">{{ nextMeetingDate }}</p>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm">Participantes:</span>
                <span class="font-semibold">{{ store.nextMeeting.participants }} socios activos</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm">Valor Acción:</span>
                <span class="font-semibold">{{ formatCurrency(store.nextMeeting.stock_value) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm">Préstamos Activos:</span>
                <span class="font-semibold">{{ store.nextMeeting.active_loans }}</span>
              </div>
            </div>
            <button @click="handleStartMeeting" class="btn btn-primary w-full">
              Iniciar Reunión →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Portfolio Status, Recent Activity, Quick Actions Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Portfolio Status Chart -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title">Estado de Cartera</h2>
          <p class="text-sm text-base-content/60 mb-4">Distribución de préstamos</p>
          <div v-if="doughnutChartData" style="height: 250px;">
            <Doughnut :data="doughnutChartData" :options="doughnutChartOptions" />
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <div class="flex justify-between items-center mb-4">
            <h2 class="card-title">Actividad Reciente</h2>
            <a href="#" class="link link-primary text-sm">Ver todo</a>
          </div>
          <div class="space-y-2">
            <ActivityItem
              v-for="activity in store.recentActivity"
              :key="activity.id"
              :type="activity.type"
              :description="activity.description"
              :amount="activity.amount"
              :timestamp="activity.timestamp"
              :member-name="activity.member_name"
            />
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title mb-4">Acciones Rápidas</h2>
          <div class="grid grid-cols-2 gap-3">
            <QuickActionButton
              title="Nuevo Socio"
              description="Registrar socio"
              :icon="User"
              @click="handleNewMember"
            />
            <QuickActionButton
              title="Nueva Acción"
              description="Vender acción"
              :icon="Plus"
              @click="handleNewStock"
            />
            <QuickActionButton
              title="Nuevo Préstamo"
              description="Crear préstamo"
              :icon="Bank"
              @click="handleNewLoan"
            />
            <QuickActionButton
              title="Registrar Pago"
              description="Recibir pago"
              :icon="Wallet"
              @click="handleRegisterPayment"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
