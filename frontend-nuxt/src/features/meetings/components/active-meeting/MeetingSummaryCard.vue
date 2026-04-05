<template>
  <div class="card bg-base-100 shadow-lg mb-4 md:mb-6 rounded-lg">
    <div class="card-body p-4 md:p-6">
      <h2 class="card-title mb-4 md:mb-6 text-lg md:text-xl font-bold">Resumen Financiero</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div class="stat bg-base-100 rounded-lg p-4">
          <div class="stat-title text-sm font-medium text-base-content/70 uppercase mb-2">Recaudo Total</div>
          <div class="stat-value text-2xl md:text-3xl font-bold text-success">
            {{ formatCurrency(summary?.total_collected || 0) }}
          </div>
        </div>
        <div class="stat bg-base-100 rounded-lg p-4">
          <div class="stat-title text-sm font-medium text-base-content/70 uppercase mb-2">Efectivo Disponible</div>
          <div class="stat-value text-2xl md:text-3xl font-bold text-base-content">
            {{ formatCurrency(summary?.total_cash || summary?.final_cash_balance || 0) }}
          </div>
        </div>
        <div class="stat bg-base-100 rounded-lg p-4">
          <div class="stat-title text-sm font-medium text-base-content/70 uppercase mb-2">Intereses Generados</div>
          <div class="stat-value text-2xl md:text-3xl font-bold text-warning">
            {{ formatCurrency(summary?.total_interest || 0) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MeetingSummary } from '@/api/meetings.api'
import { formatCurrency } from '@/shared/utils/formatters'

defineProps<{
  summary: MeetingSummary | null
}>()
</script>
