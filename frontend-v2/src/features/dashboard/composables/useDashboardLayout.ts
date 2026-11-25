import { ref, computed, watch } from 'vue'

export type MetricId = 'socios' | 'stocks' | 'loans' | 'portfolio' | 'collected'
export type WidgetId =
  | 'monthly_movements'
  | 'active_meeting'
  | 'portfolio_status'
  | 'recent_activity'

export interface DashboardLayoutState {
  metricOrder: MetricId[]
  hiddenMetrics: MetricId[]
  widgetOrder: WidgetId[]
  hiddenWidgets: WidgetId[]
}

const STORAGE_KEY = 'cs_dashboard_layout_v1'

export const DEFAULT_METRIC_ORDER: MetricId[] = [
  'socios',
  'stocks',
  'loans',
  'portfolio',
  'collected'
]

export const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  'monthly_movements',
  'active_meeting',
  'portfolio_status',
  'recent_activity'
]

export const METRIC_LABELS: Record<MetricId, string> = {
  socios: 'Socios',
  stocks: 'Total Acciones',
  loans: 'Préstamos Activos',
  portfolio: 'Cartera Total',
  collected: 'Recaudo del Último Mes'
}

export const WIDGET_LABELS: Record<WidgetId, string> = {
  monthly_movements: 'Movimientos Mensuales',
  active_meeting: 'Reunión Activa',
  portfolio_status: 'Estado de Cartera',
  recent_activity: 'Actividad Reciente'
}

function sanitizeOrder<T extends string>(stored: unknown, defaults: readonly T[]): T[] {
  if (!Array.isArray(stored)) return [...defaults]
  const validSet = new Set<T>(defaults)
  const filtered = stored.filter((item): item is T => validSet.has(item as T))
  const missing = defaults.filter((item) => !filtered.includes(item))
  return [...filtered, ...missing]
}

function sanitizeHidden<T extends string>(stored: unknown, defaults: readonly T[]): T[] {
  if (!Array.isArray(stored)) return []
  const validSet = new Set<T>(defaults)
  return Array.from(new Set(stored.filter((item): item is T => validSet.has(item as T))))
}

function loadLayout(): DashboardLayoutState {
  if (typeof window === 'undefined') {
    return {
      metricOrder: [...DEFAULT_METRIC_ORDER],
      hiddenMetrics: [],
      widgetOrder: [...DEFAULT_WIDGET_ORDER],
      hiddenWidgets: []
    }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        metricOrder: [...DEFAULT_METRIC_ORDER],
        hiddenMetrics: [],
        widgetOrder: [...DEFAULT_WIDGET_ORDER],
        hiddenWidgets: []
      }
    }
    const parsed = JSON.parse(raw) as Partial<DashboardLayoutState>
    return {
      metricOrder: sanitizeOrder(parsed.metricOrder, DEFAULT_METRIC_ORDER),
      hiddenMetrics: sanitizeHidden(parsed.hiddenMetrics, DEFAULT_METRIC_ORDER),
      widgetOrder: sanitizeOrder(parsed.widgetOrder, DEFAULT_WIDGET_ORDER),
      hiddenWidgets: sanitizeHidden(parsed.hiddenWidgets, DEFAULT_WIDGET_ORDER)
    }
  } catch {
    return {
      metricOrder: [...DEFAULT_METRIC_ORDER],
      hiddenMetrics: [],
      widgetOrder: [...DEFAULT_WIDGET_ORDER],
      hiddenWidgets: []
    }
  }
}

export function useDashboardLayout() {
  const state = ref<DashboardLayoutState>(loadLayout())

  watch(
    state,
    (newState) => {
      if (typeof window === 'undefined') return
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
      } catch {
        // Ignore storage quota errors
      }
    },
    { deep: true }
  )

  const visibleMetrics = computed(() =>
    state.value.metricOrder.filter((id) => !state.value.hiddenMetrics.includes(id))
  )

  const visibleWidgets = computed(() =>
    state.value.widgetOrder.filter((id) => !state.value.hiddenWidgets.includes(id))
  )

  const isCustomized = computed(() => {
    const defaultMetrics = JSON.stringify(DEFAULT_METRIC_ORDER)
    const defaultWidgets = JSON.stringify(DEFAULT_WIDGET_ORDER)
    return (
      state.value.hiddenMetrics.length > 0 ||
      state.value.hiddenWidgets.length > 0 ||
      JSON.stringify(state.value.metricOrder) !== defaultMetrics ||
      JSON.stringify(state.value.widgetOrder) !== defaultWidgets
    )
  })

  function isMetricVisible(id: MetricId): boolean {
    return !state.value.hiddenMetrics.includes(id)
  }

  function isWidgetVisible(id: WidgetId): boolean {
    return !state.value.hiddenWidgets.includes(id)
  }

  function toggleMetricVisibility(id: MetricId) {
    if (state.value.hiddenMetrics.includes(id)) {
      state.value.hiddenMetrics = state.value.hiddenMetrics.filter((m) => m !== id)
    } else {
      state.value.hiddenMetrics = [...state.value.hiddenMetrics, id]
    }
  }

  function toggleWidgetVisibility(id: WidgetId) {
    if (state.value.hiddenWidgets.includes(id)) {
      state.value.hiddenWidgets = state.value.hiddenWidgets.filter((w) => w !== id)
    } else {
      state.value.hiddenWidgets = [...state.value.hiddenWidgets, id]
    }
  }

  function moveInOrder<T extends string>(
    list: T[],
    visibleSubset: T[],
    id: T,
    direction: -1 | 1
  ): T[] {
    const visibleIdx = visibleSubset.indexOf(id)
    const targetVisibleIdx = visibleIdx + direction
    if (visibleIdx < 0 || targetVisibleIdx < 0 || targetVisibleIdx >= visibleSubset.length) {
      return list
    }
    const targetId = visibleSubset[targetVisibleIdx]
    const fullFrom = list.indexOf(id)
    const fullTo = list.indexOf(targetId)
    const next = [...list]
    const [moved] = next.splice(fullFrom, 1)
    next.splice(fullTo, 0, moved)
    return next
  }

  function moveMetric(id: MetricId, direction: -1 | 1) {
    state.value.metricOrder = moveInOrder(
      state.value.metricOrder,
      visibleMetrics.value,
      id,
      direction
    )
  }

  function moveWidget(id: WidgetId, direction: -1 | 1) {
    state.value.widgetOrder = moveInOrder(
      state.value.widgetOrder,
      visibleWidgets.value,
      id,
      direction
    )
  }

  function reorderVisibleMetrics(newVisibleOrder: MetricId[]) {
    const hidden = state.value.metricOrder.filter((id) => !newVisibleOrder.includes(id))
    state.value.metricOrder = [...newVisibleOrder, ...hidden]
  }

  function reorderVisibleWidgets(newVisibleOrder: WidgetId[]) {
    const hidden = state.value.widgetOrder.filter((id) => !newVisibleOrder.includes(id))
    state.value.widgetOrder = [...newVisibleOrder, ...hidden]
  }

  function resetLayout() {
    state.value = {
      metricOrder: [...DEFAULT_METRIC_ORDER],
      hiddenMetrics: [],
      widgetOrder: [...DEFAULT_WIDGET_ORDER],
      hiddenWidgets: []
    }
  }

  return {
    state,
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
  }
}
