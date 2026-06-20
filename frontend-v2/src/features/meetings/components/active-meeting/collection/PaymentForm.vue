<template>
  <div>
    <div v-if="loadingDues" class="flex items-center justify-center h-64">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else id="payment-form-receipt" class="bg-base-100 p-3 md:p-4 rounded-xl shadow-md font-sans relative overflow-hidden">
      <!-- Watermark for Draft -->
      <div class="watermark-draft">BORRADOR</div>

      <div class="text-center mb-2 md:mb-3 relative z-10">
        <h2 class="text-sm md:text-base font-bold">Recibo de Pago</h2>
        <p class="text-xs text-base-content/80 wrap-break-word font-semibold mt-0.5">
          {{ memberName }}
        </p>
        <p class="text-[10px] text-center text-base-content/70 print-only">
          {{ printDate }}
        </p>
      </div>

      <form @submit.prevent="$emit('submit')" class="space-y-3 relative z-10">
        <!-- Acciones -->
        <div v-if="stockDues.length > 0">
          <h2
            class="text-xs md:text-sm font-bold mb-1 pb-1 border-b border-base-200"
          >
            Acciones
          </h2>
          <div
            v-for="due in stockDues"
            :key="due.originalIndex"
            class="flex items-baseline py-1 gap-2"
          >
            <div class="flex-1 min-w-0">
               <p class="font-semibold text-xs wrap-break-word">
                {{ due.description }}
              </p>
              <p
                v-if="due.stock_quantity"
                class="text-[10px] text-base-content/60 wrap-break-word"
              >
                {{ formatNumber(Number(due.stock_quantity || 0)) }} uds. x
                {{ formatCurrency(due.monthly_contribution || 0) }} c/u
              </p>
            </div>
            <div
              class="hidden md:block grow border-b border-dotted border-base-200 mx-2"
            ></div>
            <div class="shrink-0">
              <p
                class="text-right font-mono text-xs md:text-sm whitespace-nowrap font-bold"
              >
                {{ formatCurrency(getPaymentAmountForDue(due) || 0) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Préstamos -->
        <div v-if="loanDues.length > 0">
          <h4
            class="text-xs md:text-sm font-bold mb-1 pb-1 border-b border-base-200"
          >
            Préstamos
          </h4>
          <div
            v-for="due in loanDues"
            :key="due.originalIndex"
            class="py-1"
          >
            <div class="flex items-baseline gap-2">
              <p
                class="font-semibold text-xs flex-1 min-w-0 wrap-break-word"
              >
                {{ due.description }}
              </p>
              <div
                class="hidden md:block grow border-b border-dotted border-base-200 mx-2"
              ></div>
              <div class="shrink-0 flex items-center gap-1.5">
                <button
                  type="button"
                  @click="$emit('edit-payment', due.originalIndex)"
                  class="btn btn-ghost btn-xs no-print text-[10px] h-auto min-h-0 py-0.5 px-1 bg-base-200 hover:bg-base-300 rounded font-semibold"
                >
                  Editar
                </button>
                <p
                  class="text-right font-mono text-xs md:text-sm whitespace-nowrap font-bold"
                >
                  {{ formatCurrency(getPaymentAmountForDue(due) || 0) }}
                </p>
              </div>
            </div>
            <div
              v-if="due.details"
              class="w-full pl-2 mt-1 space-y-0.5 text-[11px] text-base-content/75 border-l-2 border-base-200"
            >
              <div class="flex justify-between gap-2">
                <span class="shrink-0">Saldo actual:</span>
                <span class="font-mono text-right">{{
                  formatCurrency(due.details.outstanding_balance ?? 0)
                }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="shrink-0">Abono Capital:</span>
                <span class="font-mono text-right">{{
                  formatCurrency(
                    (getPaymentAmountForDue(due) || 0) -
                      (due.details.interest || 0)
                  )
                }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="shrink-0">Intereses:</span>
                <span
                  class="font-semibold text-accent font-mono text-right"
                  >{{
                    formatCurrency(due.details.interest || 0)
                  }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Otros Aportes -->
        <div>
          <div class="flex justify-between items-center flex-wrap gap-2">
            <h4
              class="text-xs md:text-sm font-bold mb-1 pb-1 border-b border-base-200"
            >
              Otros Aportes
            </h4>
            <button
              type="button"
              @click="$emit('add-fine')"
              class="btn btn-xs btn-outline btn-accent no-print rounded font-semibold"
            >
              + Otro pago
            </button>
          </div>
          <div v-if="otherDues.length > 0">
            <div
              v-for="due in otherDues"
              :key="due.originalIndex"
              class="flex items-baseline py-1 gap-2"
            >
              <p
                class="font-semibold text-xs flex-1 min-w-0 wrap-break-word"
              >
                {{ due.description }}
              </p>
              <div
                class="hidden md:block grow border-b border-dotted border-base-200 mx-2"
              ></div>
              <div class="shrink-0 flex items-center gap-1.5">
                <div class="flex gap-1">
                  <template v-if="due.type === 'fee'">
                    <button
                      type="button"
                      @click="$emit('edit-payment', due.originalIndex)"
                      class="btn btn-ghost btn-xs no-print text-[10px] h-auto min-h-0 py-0.5 px-1 bg-base-200 hover:bg-base-300 rounded font-semibold"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      @click="$emit('delete-payment', due.originalIndex)"
                      class="btn btn-ghost btn-xs text-error no-print text-[10px] h-auto min-h-0 py-0.5 px-1 bg-red-50 hover:bg-red-100 rounded font-semibold"
                    >
                      Borrar
                    </button>
                  </template>
                </div>
                <p
                  class="text-right font-mono text-xs md:text-sm whitespace-nowrap font-bold"
                >
                  {{ formatCurrency(getPaymentAmountForDue(due) || 0) }}
                </p>
              </div>
            </div>
          </div>
          <p v-else class="text-[10px] md:text-xs text-base-content/50 italic mt-1">
            Sin aportes adicionales.
          </p>
        </div>

        <!-- Novedades -->
        <div class="mt-2 md:mt-4">
          <div class="flex justify-between items-center flex-wrap gap-2">
            <h4
              class="text-xs md:text-sm font-bold mb-1 pb-1 border-b border-base-200 text-error"
            >
              Novedades
            </h4>
            <button
              type="button"
              @click="$emit('add-novelty')"
              class="btn btn-xs btn-outline btn-error no-print rounded font-semibold"
            >
              + Novedad
            </button>
          </div>
          <div v-if="noveltyPayments.length > 0">
            <div
              v-for="(novelty, idx) in noveltyPayments"
              :key="idx"
              class="flex items-baseline py-1 text-error gap-2"
            >
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-xs wrap-break-word">
                  {{ novelty.description }}
                </p>
                <p
                  v-if="novelty.noveltyComment"
                  class="text-[10px] italic wrap-break-word"
                >
                  {{ novelty.noveltyComment }}
                </p>
                <p
                  v-if="novelty.affectedPaymentType"
                  class="text-[10px] text-error/70 mt-0.5 wrap-break-word"
                >
                  Afecta: {{ getAffectedPaymentTypeLabel(novelty.affectedPaymentType) }}
                </p>
              </div>
              <div
                class="hidden md:block grow border-b border-dotted border-error/30 mx-2"
              ></div>
              <div class="shrink-0 flex items-center gap-1.5">
                <button
                  type="button"
                  @click="$emit('delete-novelty', idx)"
                  class="btn btn-ghost btn-xs text-error no-print text-[10px] h-auto min-h-0 py-0.5 px-1 bg-red-50 hover:bg-red-100 rounded font-semibold"
                >
                  Borrar
                </button>
                <p
                  class="text-right font-mono text-xs md:text-sm whitespace-nowrap font-bold"
                >
                  -{{ formatCurrency(novelty.amount) }}
                </p>
              </div>
            </div>
          </div>
          <p v-else class="text-[10px] md:text-xs text-error/50 italic mt-1">
            Sin novedades registradas.
          </p>
        </div>

        <div
          v-if="payments.length === 0 && otherDues.length === 0"
          class="text-center my-6 md:my-8 text-base-content/60"
        >
          <p class="text-sm md:text-base">
            Este socio no tiene deudas pendientes para esta reunión.
          </p>
        </div>

        <!-- Totales -->
        <div
          class="mt-4 pt-3 border-t border-dashed border-base-300 space-y-1.5"
        >
          <div
            class="flex items-baseline text-xs md:text-sm font-bold gap-2"
          >
            <span class="shrink-0">Total a Pagar:</span>
            <div
              class="hidden md:block grow border-b border-dotted border-base-200 mx-2"
            ></div>
            <span
              class="shrink-0 text-primary font-mono text-sm md:text-base whitespace-nowrap font-extrabold"
              >{{ formatCurrency(totalToPay) }}</span
            >
          </div>
          <div
            v-if="totalInterest > 0"
            class="flex items-baseline text-[11px] text-base-content/80 gap-2"
          >
            <span class="shrink-0">Total Intereses:</span>
            <div
              class="hidden md:block grow border-b border-dotted border-base-200 mx-2"
            ></div>
            <span
              class="shrink-0 font-mono text-[11px] whitespace-nowrap font-semibold"
              >{{ formatCurrency(totalInterest) }}</span
            >
          </div>
        </div>

        <div class="mt-4 flex justify-end gap-2.5 no-print">
          <button
            type="button"
            class="btn btn-outline btn-sm font-semibold rounded-lg"
            @click="$emit('print')"
            :disabled="payments.length === 0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Recibo
          </button>

          <button
            type="submit"
            class="btn btn-success btn-sm font-semibold rounded-lg text-white"
            :disabled="isSubmitting || payments.length === 0"
          >
            <span v-if="isSubmitting" class="loading loading-spinner loading-xs"></span>
            <span v-else>Confirmar Pago</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatNumber } from '@/shared/utils/formatters'
import type { MemberDue } from '@/api/members.api'
import type { Payment } from '../../../composables/usePaymentCollection'

// Props
const props = defineProps<{
  memberName: string
  printDate: string
  loadingDues: boolean
  stockDues: Array<MemberDue & { originalIndex: number }>
  loanDues: Array<MemberDue & { originalIndex: number }>
  otherDues: Array<MemberDue & { originalIndex: number }>
  noveltyPayments: Payment[]
  payments: Payment[]
  totalToPay: number
  totalInterest: number
  isSubmitting: boolean
}>()

// Emits
defineEmits<{
  submit: []
  print: []
  'edit-payment': [index: number]
  'delete-payment': [index: number]
  'add-fine': []
  'add-novelty': []
  'delete-novelty': [idx: number]
}>()

// Función para encontrar el pago correspondiente a un due
function getPaymentAmountForDue(due: MemberDue & { originalIndex: number }): number {
  const payment = props.payments.find((p) => {
    if (p.type !== due.type) return false
    // Si ambos tienen referenceId, deben coincidir
    if (due.reference_id && p.referenceId) {
      return due.reference_id === p.referenceId
    }
    // Si ninguno tiene referenceId, coinciden
    if (!due.reference_id && !p.referenceId) {
      return true
    }
    return false
  })
  return payment?.amount || 0
}

function getAffectedPaymentTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    mandatory_contribution: 'Aporte obligatorio',
    stock_fee: 'Cuota de acciones',
    loan_payment: 'Pago de préstamo',
    fee: 'Multa/otro pago',
    insurance: 'Seguro de deuda',
  }
  return typeLabels[type] || type
}
</script>

<style scoped>
.watermark-draft {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 8rem;
  font-weight: bold;
  color: #9ca3af !important; /* gray-400 */
  opacity: 0.15 !important;
  pointer-events: none;
  z-index: 0;
  user-select: none;
  white-space: nowrap;
}

@media print {
  .watermark-draft {
    color: #9ca3af !important;
    opacity: 0.2 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>

