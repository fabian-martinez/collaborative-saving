<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
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
import { meetingsApi } from '@/api/meetings.api'
import MetricCard from '../components/MetricCard.vue'
import ActivityItem from '../components/ActivityItem.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import {
  User,
  Eye,
  EyeClosed,
  Wallet,
  Bank,
  Plus,
  NavArrowLeft,
  NavArrowRight,
  Menu,
  Refresh
} from 'iconoir-vue/regular'
import { formatCurrency } from '@/shared/utils/formatters'
import {
  useDashboardLayout,
  DEFAULT_METRIC_ORDER,
  DEFAULT_WIDGET_ORDER,
  METRIC_LABELS,
  WIDGET_LABELS,
  type MetricId,
  type WidgetId
} from '../composables/useDashboardLayout'

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
const {
  visibleMetrics,
  visibleWidgets,
  isCustomized,
  isMetricVisible,
  isWidgetVisible,
  toggleMetricVisibility,
  toggleWidgetVisibility,
  moveMetric,
  moveWidget,
  reorderVisibleMetrics,
  reorderVisibleWidgets,
  resetLayout
} = useDashboardLayout()

const isCustomizing = ref(false)
const creatingMeeting = ref(false)
const createMeetingError = ref<string | null>(null)
const liveAnnouncement = ref('')

// Drag-and-drop state
const metricsContainerRef = ref<HTMLElement | null>(null)
const widgetsContainerRef = ref<HTMLElement | null>(null)

interface ActiveDragState {
  group: 'metric' | 'widget'
  id: string
  pointerId: number
  startX: number
  startY: number
  currentX: number
  currentY: number
  element: HTMLElement
  handle: HTMLElement
  dropIndex: number | null
}

const activeDrag = ref<ActiveDragState | null>(null)

onMounted(() => {
  store.fetchDashboardData()
})

function announce(message: string) {
  liveAnnouncement.value = ''
  window.setTimeout(() => {
    liveAnnouncement.value = message
  }, 50)
}

function runWithViewTransition(fn: () => void) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => unknown
  }
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!prefersReducedMotion && typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(fn)
  } else {
    fn()
  }
}

function handleMoveMetric(id: MetricId, direction: -1 | 1) {
  runWithViewTransition(() => {
    moveMetric(id, direction)
  })
  const newIndex = visibleMetrics.value.indexOf(id) + 1
  announce(
    `${METRIC_LABELS[id]} movido a la posición ${newIndex} de ${visibleMetrics.value.length}`
  )
}

function handleMoveWidget(id: WidgetId, direction: -1 | 1) {
  runWithViewTransition(() => {
    moveWidget(id, direction)
  })
  const newIndex = visibleWidgets.value.indexOf(id) + 1
  announce(
    `${WIDGET_LABELS[id]} movido a la posición ${newIndex} de ${visibleWidgets.value.length}`
  )
}

function handleToggleMetric(id: MetricId) {
  const wasVisible = isMetricVisible(id)
  runWithViewTransition(() => {
    toggleMetricVisibility(id)
  })
  announce(`${METRIC_LABELS[id]} ${wasVisible ? 'ocultado' : 'mostrado'}`)
}

function handleToggleWidget(id: WidgetId) {
  const wasVisible = isWidgetVisible(id)
  runWithViewTransition(() => {
    toggleWidgetVisibility(id)
  })
  announce(`${WIDGET_LABELS[id]} ${wasVisible ? 'ocultado' : 'mostrado'}`)
}

function handleResetLayout() {
  runWithViewTransition(() => {
    resetLayout()
  })
  announce('Diseño del panel restaurado al orden predeterminado')
}

function getContainerItems(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-drag-item]'))
}

function computeDropIndex(
  container: HTMLElement,
  clientX: number,
  clientY: number
): number {
  const items = getContainerItems(container)
  if (items.length === 0) return 0

  let closestIndex = 0
  let closestDistance = Number.POSITIVE_INFINITY

  items.forEach((item, index) => {
    const rect = item.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distance = Math.hypot(clientX - centerX, clientY - centerY)
    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  })

  return closestIndex
}

function onHandlePointerDown(
  event: PointerEvent,
  group: 'metric' | 'widget',
  id: string
) {
  if (event.button !== 0) return
  const handle = event.currentTarget as HTMLElement
  const item = handle.closest<HTMLElement>('[data-drag-item]')
  if (!item) return

  event.preventDefault()
  handle.setPointerCapture(event.pointerId)

  activeDrag.value = {
    group,
    id,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    currentX: event.clientX,
    currentY: event.clientY,
    element: item,
    handle,
    dropIndex: null
  }

  document.documentElement.classList.add('dashboard-dragging')
  window.addEventListener('keydown', onDragKeyDown)
}

function onHandlePointerMove(event: PointerEvent) {
  const drag = activeDrag.value
  if (!drag || event.pointerId !== drag.pointerId) return

  drag.currentX = event.clientX
  drag.currentY = event.clientY

  const dx = drag.currentX - drag.startX
  const dy = drag.currentY - drag.startY
  drag.element.style.translate = `${dx}px ${dy}px`

  const container =
    drag.group === 'metric' ? metricsContainerRef.value : widgetsContainerRef.value
  if (container) {
    drag.dropIndex = computeDropIndex(container, event.clientX, event.clientY)
  }
}

function cleanupDrag(cancelled = false) {
  const drag = activeDrag.value
  if (!drag) return

  drag.element.style.translate = ''
  if (drag.handle.hasPointerCapture(drag.pointerId)) {
    drag.handle.releasePointerCapture(drag.pointerId)
  }
  document.documentElement.classList.remove('dashboard-dragging')
  window.removeEventListener('keydown', onDragKeyDown)

  if (cancelled) {
    const label =
      drag.group === 'metric'
        ? METRIC_LABELS[drag.id as MetricId]
        : WIDGET_LABELS[drag.id as WidgetId]
    announce(`Movimiento de ${label} cancelado`)
  }

  activeDrag.value = null
}

function onDragKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && activeDrag.value) {
    event.preventDefault()
    cleanupDrag(true)
  }
}

function onHandlePointerUp(event: PointerEvent) {
  const drag = activeDrag.value
  if (!drag || event.pointerId !== drag.pointerId) return

  const targetIndex = drag.dropIndex
  const group = drag.group
  const id = drag.id

  cleanupDrag(false)

  if (targetIndex === null) return

  if (group === 'metric') {
    const currentOrder = [...visibleMetrics.value]
    const fromIndex = currentOrder.indexOf(id as MetricId)
    if (fromIndex !== -1 && fromIndex !== targetIndex) {
      const [moved] = currentOrder.splice(fromIndex, 1)
      currentOrder.splice(targetIndex, 0, moved)
      runWithViewTransition(() => {
        reorderVisibleMetrics(currentOrder)
      })
      announce(
        `${METRIC_LABELS[id as MetricId]} movido a la posición ${targetIndex + 1} de ${currentOrder.length}`
      )
    }
  } else {
    const currentOrder = [...visibleWidgets.value]
    const fromIndex = currentOrder.indexOf(id as WidgetId)
    if (fromIndex !== -1 && fromIndex !== targetIndex) {
      const [moved] = currentOrder.splice(fromIndex, 1)
      currentOrder.splice(targetIndex, 0, moved)
      runWithViewTransition(() => {
        reorderVisibleWidgets(currentOrder)
      })
      announce(
        `${WIDGET_LABELS[id as WidgetId]} movido a la posición ${targetIndex + 1} de ${currentOrder.length}`
      )
    }
  }
}

function onHandleLostPointerCapture(event: PointerEvent) {
  if (activeDrag.value && event.pointerId === activeDrag.value.pointerId) {
    cleanupDrag(true)
  }
}

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

const LOAN_TYPE_COLORS = [
  'rgb(59, 130, 246)',
  'rgb(34, 197, 94)',
  'rgb(251, 146, 60)',
  'rgb(168, 85, 247)',
  'rgb(236, 72, 153)',
  'rgb(20, 184, 166)'
]

const doughnutChartData = computed(() => {
  const byType = store.portfolioStatus?.by_type
  if (!byType || byType.length === 0) return null
  return {
    labels: byType.map((item) => item.name),
    datasets: [
      {
        data: byType.map((item) => item.count),
        backgroundColor: byType.map(
          (_, idx) => LOAN_TYPE_COLORS[idx % LOAN_TYPE_COLORS.length]
        ),
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

const recentActivities = computed(() => store.recentActivity.slice(0, 5))

function handleGoToActiveMeeting() {
  router.push('/meetings/active')
}

async function handleCreateMeeting() {
  creatingMeeting.value = true
  createMeetingError.value = null
  try {
    await meetingsApi.createMeeting({ date: new Date().toISOString() })
    router.push('/meetings/active')
  } catch (err) {
    createMeetingError.value =
      err instanceof Error ? err.message : 'No se pudo crear la reunión'
  } finally {
    creatingMeeting.value = false
  }
}

const activeMeetingDate = computed(() => {
  if (!store.nextMeeting) return ''
  const date = new Date(store.nextMeeting.date)
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
})
</script>

<template>
  <div class="space-y-6">
    <p role="status" class="visually-hidden">{{ liveAnnouncement }}</p>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-bold">Panel Principal</h1>
      <div class="flex items-center gap-2">
        <button
          v-if="isCustomized"
          type="button"
          class="btn btn-ghost btn-sm gap-1"
          @click="handleResetLayout"
        >
          <Refresh class="w-4 h-4" />
          Restaurar
        </button>
        <button
          type="button"
          class="btn btn-sm gap-1"
          :class="isCustomizing ? 'btn-primary' : 'btn-outline'"
          :aria-pressed="isCustomizing"
          @click="isCustomizing = !isCustomizing"
        >
          <Menu class="w-4 h-4" />
          {{ isCustomizing ? 'Listo' : 'Personalizar' }}
        </button>
      </div>
    </div>

    <!-- Customization visibility panel -->
    <div
      v-if="isCustomizing"
      class="card bg-base-200/70 border border-base-300 shadow-sm"
    >
      <div class="card-body py-4 px-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm font-medium">
            Arrastra los elementos desde el ícono de agarre, usa las flechas o activa/desactiva su visibilidad.
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider opacity-60 mb-2">
              Tarjetas de métricas
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="metricId in DEFAULT_METRIC_ORDER"
                :key="metricId"
                type="button"
                class="btn btn-xs gap-1"
                :class="isMetricVisible(metricId) ? 'btn-primary' : 'btn-ghost border-base-300'"
                :aria-pressed="isMetricVisible(metricId)"
                @click="handleToggleMetric(metricId)"
              >
                <Eye v-if="isMetricVisible(metricId)" class="w-3.5 h-3.5" />
                <EyeClosed v-else class="w-3.5 h-3.5" />
                {{ METRIC_LABELS[metricId] }}
              </button>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider opacity-60 mb-2">
              Secciones
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="widgetId in DEFAULT_WIDGET_ORDER"
                :key="widgetId"
                type="button"
                class="btn btn-xs gap-1"
                :class="isWidgetVisible(widgetId) ? 'btn-primary' : 'btn-ghost border-base-300'"
                :aria-pressed="isWidgetVisible(widgetId)"
                @click="handleToggleWidget(widgetId)"
              >
                <Eye v-if="isWidgetVisible(widgetId)" class="w-3.5 h-3.5" />
                <EyeClosed v-else class="w-3.5 h-3.5" />
                {{ WIDGET_LABELS[widgetId] }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <LoadingSpinner :loading="store.loading" />
    <ErrorMessage :error="store.error" />

    <!-- Metrics Cards -->
    <div
      v-if="store.metrics && visibleMetrics.length > 0"
      ref="metricsContainerRef"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="(metricId, index) in visibleMetrics"
        :key="metricId"
        data-drag-item
        class="dashboard-item group relative"
        :class="{
          'is-dragging': activeDrag?.group === 'metric' && activeDrag?.id === metricId,
          'ring-2 ring-primary ring-offset-2 rounded-2xl':
            activeDrag?.group === 'metric' &&
            activeDrag?.dropIndex === index &&
            activeDrag?.id !== metricId
        }"
      >
        <div
          class="dashboard-controls absolute top-2 right-2 z-10 flex items-center gap-1 rounded-lg bg-base-100/90 backdrop-blur px-1.5 py-1 shadow-sm border border-base-300 transition-opacity"
          :class="isCustomizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'"
        >
          <button
            type="button"
            class="drag-handle btn btn-ghost btn-xs px-1"
            :aria-label="`Reordenar ${METRIC_LABELS[metricId]}`"
            title="Arrastrar para reordenar"
            @pointerdown="onHandlePointerDown($event, 'metric', metricId)"
            @pointermove="onHandlePointerMove"
            @pointerup="onHandlePointerUp"
            @pointercancel="onHandleLostPointerCapture"
            @lostpointercapture="onHandleLostPointerCapture"
          >
            <Menu class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs px-1"
            :disabled="index === 0"
            :aria-label="`Mover ${METRIC_LABELS[metricId]} antes`"
            title="Mover antes"
            @click="handleMoveMetric(metricId, -1)"
          >
            <NavArrowLeft class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs px-1"
            :disabled="index === visibleMetrics.length - 1"
            :aria-label="`Mover ${METRIC_LABELS[metricId]} después`"
            title="Mover después"
            @click="handleMoveMetric(metricId, 1)"
          >
            <NavArrowRight class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs px-1 text-error"
            :aria-label="`Ocultar ${METRIC_LABELS[metricId]}`"
            title="Ocultar tarjeta"
            @click="handleToggleMetric(metricId)"
          >
            <EyeClosed class="w-3.5 h-3.5" />
          </button>
        </div>

        <MetricCard
          v-if="metricId === 'socios'"
          title="Socios"
          :value="`${store.metrics.active_members.count}/20`"
          :subtitle="`${store.metrics.active_members.total} registrados`"
          :icon="User"
        />
        <MetricCard
          v-else-if="metricId === 'stocks'"
          title="Total Acciones"
          :value="store.metrics.total_stocks.count"
          :subtitle="formatCurrency(store.metrics.total_stocks.value)"
          :icon="Eye"
        />
        <MetricCard
          v-else-if="metricId === 'loans'"
          title="Préstamos Activos"
          :value="store.metrics.active_loans.count"
          subtitle="En cartera"
          :icon="Bank"
        />
        <MetricCard
          v-else-if="metricId === 'portfolio'"
          title="Cartera Total"
          :value="formatCurrency(store.metrics.total_portfolio.value)"
          bg-color="primary"
        />
        <MetricCard
          v-else-if="metricId === 'collected'"
          title="Recaudo del Último Mes"
          :value="formatCurrency(store.metrics.monthly_collected.value)"
          :icon="Wallet"
        />
      </div>
    </div>

    <!-- Main Dashboard Widgets -->
    <div
      v-if="visibleWidgets.length > 0"
      ref="widgetsContainerRef"
      class="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="(widgetId, index) in visibleWidgets"
        :key="widgetId"
        data-drag-item
        class="dashboard-item group relative"
        :class="[
          widgetId === 'monthly_movements' ? 'lg:col-span-2' : '',
          activeDrag?.group === 'widget' && activeDrag?.id === widgetId ? 'is-dragging' : '',
          activeDrag?.group === 'widget' &&
          activeDrag?.dropIndex === index &&
          activeDrag?.id !== widgetId
            ? 'ring-2 ring-primary ring-offset-2 rounded-2xl'
            : ''
        ]"
      >
        <div
          class="dashboard-controls absolute top-3 right-3 z-10 flex items-center gap-1 rounded-lg bg-base-100/90 backdrop-blur px-1.5 py-1 shadow-sm border border-base-300 transition-opacity"
          :class="isCustomizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'"
        >
          <button
            type="button"
            class="drag-handle btn btn-ghost btn-xs px-1"
            :aria-label="`Reordenar ${WIDGET_LABELS[widgetId]}`"
            title="Arrastrar para reordenar"
            @pointerdown="onHandlePointerDown($event, 'widget', widgetId)"
            @pointermove="onHandlePointerMove"
            @pointerup="onHandlePointerUp"
            @pointercancel="onHandleLostPointerCapture"
            @lostpointercapture="onHandleLostPointerCapture"
          >
            <Menu class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs px-1"
            :disabled="index === 0"
            :aria-label="`Mover ${WIDGET_LABELS[widgetId]} antes`"
            title="Mover antes"
            @click="handleMoveWidget(widgetId, -1)"
          >
            <NavArrowLeft class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs px-1"
            :disabled="index === visibleWidgets.length - 1"
            :aria-label="`Mover ${WIDGET_LABELS[widgetId]} después`"
            title="Mover después"
            @click="handleMoveWidget(widgetId, 1)"
          >
            <NavArrowRight class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs px-1 text-error"
            :aria-label="`Ocultar ${WIDGET_LABELS[widgetId]}`"
            title="Ocultar sección"
            @click="handleToggleWidget(widgetId)"
          >
            <EyeClosed class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Monthly Movements Chart -->
        <div v-if="widgetId === 'monthly_movements'" class="card bg-base-100 shadow-lg h-full">
          <div class="card-body">
            <h2 class="card-title">Movimientos Mensuales</h2>
            <p class="text-sm text-base-content/60 mb-4">Recaudos vs Desembolsos</p>
            <div v-if="lineChartData" style="height: 300px;">
              <Line :data="lineChartData" :options="lineChartOptions" />
            </div>
          </div>
        </div>

        <!-- Active Meeting Card -->
        <div v-else-if="widgetId === 'active_meeting'" class="card bg-base-100 shadow-lg h-full">
          <div class="card-body">
            <h2 class="card-title">Reunión Activa</h2>
            <div v-if="store.nextMeeting" class="space-y-4">
              <div>
                <p class="text-2xl font-bold capitalize">{{ activeMeetingDate }}</p>
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
              <button @click="handleGoToActiveMeeting" class="btn btn-primary w-full">
                Ir a la Reunión →
              </button>
            </div>
            <div v-else class="flex flex-col justify-between flex-1 gap-4 py-2">
              <p class="text-base-content/60">
                No hay ninguna reunión activa en este momento.
              </p>
              <p v-if="createMeetingError" class="text-error text-sm">
                {{ createMeetingError }}
              </p>
              <button
                type="button"
                class="btn btn-primary w-full gap-2"
                :disabled="creatingMeeting"
                @click="handleCreateMeeting"
              >
                <Plus class="w-4 h-4" />
                {{ creatingMeeting ? 'Creando reunión...' : 'Crear Reunión' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Portfolio Status Chart (by Loan Type) -->
        <div v-else-if="widgetId === 'portfolio_status'" class="card bg-base-100 shadow-lg h-full">
          <div class="card-body">
            <h2 class="card-title">Estado de Cartera</h2>
            <p class="text-sm text-base-content/60 mb-4">Distribución por tipo de préstamo</p>
            <div v-if="doughnutChartData" style="height: 250px;">
              <Doughnut :data="doughnutChartData" :options="doughnutChartOptions" />
            </div>
            <div v-else class="text-base-content/60 py-8 text-center text-sm">
              No hay préstamos activos en cartera.
            </div>
          </div>
        </div>

        <!-- Recent Activity (max 5) -->
        <div v-else-if="widgetId === 'recent_activity'" class="card bg-base-100 shadow-lg h-full">
          <div class="card-body">
            <div class="flex justify-between items-center mb-4">
              <h2 class="card-title">Actividad Reciente</h2>
            </div>
            <div v-if="recentActivities.length > 0" class="space-y-2">
              <ActivityItem
                v-for="activity in recentActivities"
                :key="activity.id"
                :type="activity.type"
                :description="activity.description"
                :amount="activity.amount"
                :timestamp="activity.timestamp"
                :member-name="activity.member_name"
              />
            </div>
            <div v-else class="text-base-content/60 py-8 text-center text-sm">
              No hay actividad reciente registrada.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-item {
  view-transition-name: match-element;
}

.dashboard-item.is-dragging {
  position: relative;
  z-index: 30;
  scale: 1.02;
  opacity: 0.9;
  pointer-events: none;
}

.drag-handle {
  cursor: grab;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none;
  }
}
</style>

<style>
.dashboard-dragging,
.dashboard-dragging * {
  cursor: grabbing !important;
}
</style>
