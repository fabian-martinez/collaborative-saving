<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- Panel 1: Asistencia -->
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <h3 class="card-title text-lg mb-2">Asistencia</h3>
        <div class="space-y-2">
          <div class="text-3xl font-bold">
            {{ metrics.attendance.current }}
            <span class="text-sm font-normal text-base-content/60">
              participantes
            </span>
          </div>
          <div v-if="metrics.attendance.percentage > 0" class="w-full">
            <progress
              class="progress progress-info w-full"
              :value="metrics.attendance.percentage"
              max="100"
            ></progress>
            <div class="text-xs text-base-content/60 mt-1">
              {{ metrics.attendance.percentage.toFixed(1) }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel 2: Revalorización -->
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <h3 class="card-title text-lg mb-2">Revalorización</h3>
        <div v-if="metrics.revaluation" class="space-y-2">
          <div
            class="text-2xl font-bold"
            :class="
              metrics.revaluation.percentage >= 0
                ? 'text-success'
                : 'text-error'
            "
          >
            {{ metrics.revaluation.percentage >= 0 ? '+' : ''
            }}{{ metrics.revaluation.percentage.toFixed(2) }}%
          </div>
          <div class="text-sm text-base-content/60 space-y-1">
            <div>
              Valor acción: {{ formatCurrency(metrics.revaluation.previousValue) }}
              →
              {{ formatCurrency(metrics.revaluation.newValue) }}
            </div>
          </div>
        </div>
        <div v-else class="text-base-content/60">
          No hubo revaluación en esta reunión
        </div>
      </div>
    </div>

    <!-- Panel 3: Pagos al día -->
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <h3 class="card-title text-lg mb-2">Pagos al día</h3>
        <div class="flex items-center gap-3">
          <CheckCircle class="w-8 h-8 text-success" />
          <div>
            <div class="text-3xl font-bold">{{ metrics.paymentsUpToDate }}</div>
            <div class="text-sm text-base-content/60">préstamos</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel 4: En mora -->
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <h3 class="card-title text-lg mb-2">En mora</h3>
        <div class="flex items-center gap-3">
          <WarningTriangle class="w-8 h-8 text-error" />
          <div>
            <div class="text-3xl font-bold text-error">
              {{ metrics.overduePayments }}
            </div>
            <div class="text-sm text-base-content/60">pagos pendientes</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircle,
  WarningTriangle,
} from 'iconoir-vue/regular'
import { formatCurrency } from '@/shared/utils/formatters'
import type { MeetingSummaryData } from '../../composables/useMeetingSummary'

const props = defineProps<{
  summary: MeetingSummaryData
}>()

const metrics = computed(() => props.summary.metrics)
</script>
