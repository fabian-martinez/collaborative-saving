<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <h2 class="card-title text-xl mb-4">Desembolsos</h2>

      <div class="space-y-3">
        <!-- Nuevos préstamos -->
        <div class="flex items-center justify-between py-2 border-b border-base-300">
          <div class="flex items-center gap-3 flex-1">
            <HandCash class="w-5 h-5 text-base-content/70" />
            <div class="flex-1">
              <div class="font-medium">Nuevos préstamos</div>
              <div class="text-sm text-base-content/60">
                {{ summary.disbursements.newLoans.count }}
                {{ summary.disbursements.newLoans.count === 1 ? 'préstamo' : 'préstamos' }}
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-warning">
              {{ formatCurrency(summary.disbursements.newLoans.amount) }}
            </div>
          </div>
        </div>

        <!-- Liquidación acciones -->
        <div class="flex items-center justify-between py-2 border-b border-base-300">
          <div class="flex items-center gap-3 flex-1">
            <GraphDown class="w-5 h-5 text-base-content/70" />
            <div class="flex-1">
              <div class="font-medium">Liquidación acciones</div>
              <div class="text-sm text-base-content/60">
                {{ summary.disbursements.stockLiquidations.count }}
                {{ summary.disbursements.stockLiquidations.count === 1 ? 'liquidación' : 'liquidaciones' }}
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-warning">
              {{ formatCurrency(summary.disbursements.stockLiquidations.amount) }}
            </div>
          </div>
        </div>

        <!-- Pago de dividendos -->
        <div class="flex items-center justify-between py-2 border-b border-base-300">
          <div class="flex items-center gap-3 flex-1">
            <Coins class="w-5 h-5 text-base-content/70" />
            <div class="flex-1">
              <div class="font-medium">Pago de dividendos</div>
              <div class="text-sm text-base-content/60">
                {{ summary.disbursements.dividendPayments.count }}
                {{ summary.disbursements.dividendPayments.count === 1 ? 'pago' : 'pagos' }}
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-warning">
              {{ formatCurrency(summary.disbursements.dividendPayments.amount) }}
            </div>
          </div>
        </div>

        <!-- Total Desembolsado -->
        <div class="flex items-center justify-between py-3 mt-4 border-t-2 border-dashed border-base-300">
          <div class="font-bold text-lg">Total Desembolsado</div>
          <div class="font-bold text-lg text-warning">
            {{ formatCurrency(summary.totalDisbursed) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HandCash, GraphDown, Coins } from 'iconoir-vue/regular'
import { formatCurrency } from '@/shared/utils/formatters'
import type { MeetingSummaryData } from '../../composables/useMeetingSummary'

defineProps<{
  summary: MeetingSummaryData
}>()
</script>
