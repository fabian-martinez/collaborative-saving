<script setup lang="ts">
import type { MeetingDetailSummary } from '../types'

defineProps<{ summary: MeetingDetailSummary }>()

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
</script>

<template>
  <div class="card bg-base-100 shadow">
    <div class="card-body">
      <h2 class="card-title">Resumen General</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <div class="text-gray-500">Recaudo total</div>
          <div class="font-semibold">{{ formatCurrency(summary.totalCollected) }}</div>
        </div>
        <div>
          <div class="text-gray-500">Intereses generados</div>
          <div class="font-semibold">{{ formatCurrency(summary.totalInterest) }}</div>
        </div>
        <div>
          <div class="text-gray-500">Dinero desembolsado</div>
          <div class="font-semibold">{{ formatCurrency(summary.totalDisbursed) }}</div>
        </div>
        <div>
          <div class="text-gray-500">Efectivo final</div>
          <div class="font-semibold">{{ formatCurrency(summary.finalCashBalance) }}</div>
        </div>
        <div>
          <div class="text-gray-500">Duración</div>
          <div class="font-semibold">{{ summary.duration }}</div>
        </div>
        <div>
          <div class="text-gray-500">Participantes</div>
          <div class="font-semibold">{{ summary.participantsCount }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>


