<template>
  <dialog :open="visible" class="modal" :class="{ 'modal-open': visible }">
    <div class="modal-box max-w-2xl">
      <div class="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 class="font-bold text-lg text-base-content">
            Detalle de Préstamo — {{ loan?.loan_type }}
          </h3>
          <p class="text-xs text-base-content/60">
            Desglose de abono a capital e intereses
          </p>
        </div>
        <button type="button" class="btn btn-sm btn-ghost btn-circle" @click="$emit('close')">✕</button>
      </div>

      <div v-if="loan" class="space-y-4">
        <!-- Resumen del préstamo -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-base-200/70 rounded-xl p-3.5 text-xs">
          <div>
            <span class="text-base-content/60">Saldo Pendiente</span>
            <p class="font-bold font-mono text-sm mt-0.5">{{ formatCurrency(loan.outstanding_balance) }}</p>
          </div>
          <div>
            <span class="text-base-content/60">Cuota Mensual</span>
            <p class="font-bold font-mono text-sm mt-0.5">{{ formatCurrency(loan.monthly_payment_amount) }}</p>
          </div>
          <div>
            <span class="text-base-content/60">Tasa de Interés</span>
            <p class="font-semibold text-sm mt-0.5">{{ formatPercentage(loan.interest_rate, 2) }}</p>
          </div>
          <div>
            <span class="text-base-content/60">Plazo</span>
            <p class="font-semibold text-sm mt-0.5">{{ loan.term }} meses</p>
          </div>
        </div>

        <!-- Desglose de Próxima Cuota: Capital vs Interés -->
        <div class="border border-base-300 rounded-xl p-4 space-y-2">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-base-content/70">
            Desglose Próxima Cuota
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div class="bg-base-200/50 rounded-lg p-3">
              <span class="text-base-content/60">Abono a Capital</span>
              <p class="text-base font-bold font-mono text-success mt-0.5">
                {{ formatCurrency(nextBreakdown.principal) }}
              </p>
            </div>
            <div class="bg-base-200/50 rounded-lg p-3">
              <span class="text-base-content/60">Intereses</span>
              <p class="text-base font-bold font-mono text-warning mt-0.5">
                {{ formatCurrency(nextBreakdown.interest) }}
              </p>
            </div>
            <div class="bg-base-200/50 rounded-lg p-3">
              <span class="text-base-content/60">Total Cuota</span>
              <p class="text-base font-bold font-mono text-base-content mt-0.5">
                {{ formatCurrency(nextBreakdown.total) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Tabla de cuotas proyectadas de este préstamo -->
        <div class="space-y-2">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-base-content/70">
            Proyección de Cuotas del Préstamo
          </h4>
          <div v-if="loanScheduleItems.length === 0" class="text-xs text-base-content/60 py-4 text-center border border-base-300 rounded-xl">
            No hay cuotas proyectadas disponibles para este préstamo
          </div>
          <div v-else class="overflow-x-auto border border-base-300 rounded-xl max-h-60">
            <table class="table table-xs w-full text-xs">
              <thead class="bg-base-200 text-base-content/70 sticky top-0">
                <tr>
                  <th>Fecha</th>
                  <th class="text-right">Capital</th>
                  <th class="text-right">Interés</th>
                  <th class="text-right">Total</th>
                  <th class="text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in loanScheduleItems" :key="idx">
                  <td class="font-mono">{{ formatDate(item.date) }}</td>
                  <td class="text-right font-mono text-success">{{ formatCurrency(item.principal_amount) }}</td>
                  <td class="text-right font-mono text-warning">{{ formatCurrency(item.interest_amount) }}</td>
                  <td class="text-right font-mono font-semibold">{{ formatCurrency(item.total_amount) }}</td>
                  <td class="text-right font-mono text-base-content/70">
                    {{ item.remaining_balance !== undefined ? formatCurrency(item.remaining_balance) : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button type="button" class="btn btn-sm" @click="$emit('close')">Cerrar</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @click="$emit('close')">
      <button type="button">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, formatDate, formatPercentage } from '@/shared/utils/formatters'
import type { Loan, PaymentScheduleItem } from '@/api/members.api'

const props = defineProps<{
  visible: boolean
  loan: Loan | null
  projectedPayments: PaymentScheduleItem[]
}>()

defineEmits<{
  close: []
}>()

const loanScheduleItems = computed(() => {
  if (!props.loan) return []
  return props.projectedPayments.filter(item => item.loan_id === props.loan!.id)
})

const nextBreakdown = computed(() => {
  const firstItem = loanScheduleItems.value[0]
  if (firstItem) {
    return {
      principal: firstItem.principal_amount,
      interest: firstItem.interest_amount,
      total: firstItem.total_amount
    }
  }
  if (!props.loan) {
    return { principal: 0, interest: 0, total: 0 }
  }
  const estimatedInterest = Math.round(
    props.loan.outstanding_balance * (props.loan.interest_rate / 100)
  )
  const total = props.loan.monthly_payment_amount
  const principal = Math.max(0, total - estimatedInterest)
  return {
    principal,
    interest: estimatedInterest,
    total
  }
})
</script>
