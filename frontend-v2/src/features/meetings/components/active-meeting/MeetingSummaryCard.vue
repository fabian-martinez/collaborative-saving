<template>
  <div class="card bg-base-100 border border-base-200 shadow-sm mb-1.5 rounded-xl">
    <div class="card-body py-2 px-3 md:px-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 divide-y sm:divide-y-0 lg:divide-x divide-base-200">
        <!-- Ahorro Cobrado -->
        <div class="flex items-center gap-3 p-1">
          <div class="w-8.5 h-8.5 rounded-full bg-teal-50 flex items-center justify-center shrink-0 p-1.5">
            <!-- Wallet Icon -->
            <Wallet class="w-4.5 h-4.5 text-teal-700" />
          </div>
          <div class="min-w-0">
            <div class="text-[10px] font-bold text-base-content/50 uppercase tracking-wider">Ahorro Cobrado</div>
            <div class="text-base md:text-[17px] font-bold text-base-content mt-0.5">
              {{ formatCurrency(summary?.total_stock_investment || 0) }}
            </div>
          </div>
        </div>

        <!-- Préstamos Cobrados -->
        <div class="flex items-center gap-3 p-1 sm:pt-0 lg:pl-5">
          <div class="w-8.5 h-8.5 rounded-full bg-teal-50 flex items-center justify-center shrink-0 p-1.5">
            <!-- Trend Up Icon -->
            <ArrowUpRight class="w-4.5 h-4.5 text-teal-700" />
          </div>
          <div class="min-w-0">
            <div class="text-[10px] font-bold text-base-content/50 uppercase tracking-wider">Préstamos Cobrados</div>
            <div class="text-base md:text-[17px] font-bold text-base-content mt-0.5">
              {{ formatCurrency(summary?.total_loans || 0) }}
            </div>
          </div>
        </div>

        <!-- Total Recaudado -->
        <div class="flex items-center gap-3 p-1 pt-1 sm:pt-0 lg:pl-5">
          <div class="w-8.5 h-8.5 rounded-full bg-teal-50 flex items-center justify-center shrink-0 p-1.5">
            <!-- Cash Icon -->
            <Coins class="w-4.5 h-4.5 text-teal-700" />
          </div>
          <div class="min-w-0">
            <div class="text-[10px] font-bold text-base-content/50 uppercase tracking-wider">Total Recaudado</div>
            <div class="text-base md:text-[17px] font-bold text-base-content mt-0.5">
              {{ formatCurrency(summary?.total_collected || 0) }}
            </div>
          </div>
        </div>

        <!-- Asistencia de Socios -->
        <div class="flex items-center gap-3 p-1 pt-1 sm:pt-0 lg:pl-5">
          <div class="w-8.5 h-8.5 rounded-full bg-teal-50 flex items-center justify-center shrink-0 p-1.5">
            <!-- People Icon -->
            <Group class="w-4.5 h-4.5 text-teal-700" />
          </div>
          <div class="min-w-0">
            <div class="text-[10px] font-bold text-base-content/50 uppercase tracking-wider">Asistencia de Socios</div>
            <div class="text-base md:text-[17px] font-bold text-base-content mt-0.5">
              {{ summary?.participants_count || 12 }} / 15
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MeetingSummary } from '@/api/meetings.api'
import { formatCurrency } from '@/shared/utils/formatters'
import { Wallet, ArrowUpRight, Coins, Group } from 'iconoir-vue/regular'

defineProps<{
  summary: MeetingSummary | null
}>()
</script>

