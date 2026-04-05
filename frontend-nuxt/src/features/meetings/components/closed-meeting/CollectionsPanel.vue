<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <h2 class="card-title text-xl mb-4">Recaudos</h2>

      <div class="space-y-3">
        <!-- Aportes de socios -->
        <div class="flex items-center justify-between py-2 border-b border-base-300">
          <div class="flex items-center gap-3 flex-1">
            <UserPlus class="w-5 h-5 text-base-content/70" />
            <div class="flex-1">
              <div class="font-medium">Aportes de socios</div>
              <div class="text-sm text-base-content/60">
                {{ summary.collections.memberContributions.count }}
                {{ summary.collections.memberContributions.count === 1 ? 'aporte' : 'aportes' }}
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-success">
              {{ formatCurrency(summary.collections.memberContributions.amount) }}
            </div>
          </div>
        </div>

        <!-- Pagos de préstamos -->
        <div class="flex items-center justify-between py-2 border-b border-base-300">
          <div class="flex items-center gap-3 flex-1">
            <Wallet class="w-5 h-5 text-base-content/70" />
            <div class="flex-1">
              <div class="font-medium">Pagos de préstamos</div>
              <div class="text-sm text-base-content/60">
                {{ summary.collections.loanPayments.count }}
                {{ summary.collections.loanPayments.count === 1 ? 'pago' : 'pagos' }}
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-success">
              {{ formatCurrency(summary.collections.loanPayments.amount) }}
            </div>
          </div>
        </div>

        <!-- Intereses cobrados -->
        <div class="flex items-center justify-between py-2 border-b border-base-300">
          <div class="flex items-center gap-3 flex-1">
            <StatsReport class="w-5 h-5 text-base-content/70" />
            <div class="flex-1">
              <div class="font-medium">Intereses cobrados</div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-success">
              {{ formatCurrency(summary.collections.interestCollected) }}
            </div>
          </div>
        </div>

        <!-- Moras recaudadas -->
        <div class="flex items-center justify-between py-2 border-b border-base-300">
          <div class="flex items-center gap-3 flex-1">
            <Alarm class="w-5 h-5 text-base-content/70" />
            <div class="flex-1">
              <div class="font-medium">Moras recaudadas</div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-success">
              {{ formatCurrency(summary.collections.feesCollected) }}
            </div>
          </div>
        </div>

        <!-- Total Recaudado -->
        <div class="flex items-center justify-between py-3 mt-4 border-t-2 border-dashed border-base-300">
          <div class="font-bold text-lg">Total Recaudado</div>
          <div class="font-bold text-lg text-success">
            {{ formatCurrency(summary.totalCollected) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  UserPlus,
  Wallet,
  StatsReport,
  Alarm,
} from 'iconoir-vue/regular'
import { formatCurrency } from '@/shared/utils/formatters'
import type { MeetingSummaryData } from '../../composables/useMeetingSummary'

defineProps<{
  summary: MeetingSummaryData
}>()
</script>
