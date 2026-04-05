<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <!-- Total Recaudado -->
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h3 class="text-sm font-medium text-base-content/70">Total Recaudado</h3>
            <p class="text-2xl font-bold mt-2 text-success">
              {{ formatCurrency(summary.totalCollected) }}
            </p>
          </div>
          <div class="ml-4">
            <ArrowUp class="w-8 h-8 text-success opacity-70" />
          </div>
        </div>
      </div>
    </div>

    <!-- Total Desembolsado -->
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h3 class="text-sm font-medium text-base-content/70">Total Desembolsado</h3>
            <p class="text-2xl font-bold mt-2 text-warning">
              {{ formatCurrency(summary.totalDisbursed) }}
            </p>
          </div>
          <div class="ml-4">
            <ArrowUpRight class="w-8 h-8 text-warning opacity-70" />
          </div>
        </div>
      </div>
    </div>

    <!-- Valor Acción -->
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h3 class="text-sm font-medium text-base-content/70">Valor Acción</h3>
            <p class="text-2xl font-bold mt-2">
              {{ formatCurrency(summary.shareValue) }}
            </p>
          </div>
          <div class="ml-4">
            <Clock class="w-8 h-8 text-base-content/70 opacity-70" />
          </div>
        </div>
      </div>
    </div>

    <!-- Participantes -->
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h3 class="text-sm font-medium text-base-content/70">Participantes</h3>
            <p class="text-2xl font-bold mt-2">
              {{ summary.participants }}
            </p>
          </div>
          <div class="ml-4">
            <Group class="w-8 h-8 text-base-content/70 opacity-70" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowUp, ArrowUpRight, Clock, Group } from 'iconoir-vue/regular'
import { formatCurrency } from '@/shared/utils/formatters'
import type { MeetingSummaryData } from '../../composables/useMeetingSummary'

defineProps<{
  summary: MeetingSummaryData
}>()
</script>
