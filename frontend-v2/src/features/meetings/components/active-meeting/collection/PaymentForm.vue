<template>
  <div>
    <div v-if="loadingDues" class="flex items-center justify-center h-64">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else id="payment-form-receipt" class="bg-base-100 p-4 md:p-6 rounded-2xl shadow-lg font-sans relative overflow-hidden">
      <!-- Watermark for Draft -->
      <div class="watermark-draft">BORRADOR</div>

      <div class="text-center mb-4 md:mb-6 relative z-10">
        <h2 class="text-xl md:text-2xl font-bold">Recibo de Pago</h2>
        <p class="text-base md:text-lg text-base-content/80 wrap-break-word">
          {{ memberName }}
        </p>
        <p class="text-sm text-center text-base-content/70 print-only">
          {{ printDate }}
        </p>
      </div>

      <form @submit.prevent="$emit('submit')" class="space-y-4 md:space-y-6 relative z-10">
        <!-- Acciones -->
        <div v-if="stockDues.length > 0">
          <h2
            class="text-lg md:text-2xl font-semibold mb-2 md:mb-3 pb-2 border-b-2 border-base-300/70"
          >
            Acciones
          </h2>
          <div
            v-for="due in stockDues"
            :key="due.originalIndex"
            class="flex items-baseline py-2 md:py-3 gap-2"
          >
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-base md:text-xl wrap-break-word">
                {{ due.description }}
              </p>
              <p
                v-if="due.stock_quantity"
                class="text-xs md:text-sm text-base-content/70 wrap-break-word"
              >
                {{ formatNumber(Number(due.stock_quantity || 0)) }} uds. x
                {{ formatCurrency(due.monthly_contribution || 0) }} c/u
              </p>
            </div>
            <div
              class="hidden md:block grow border-b-2 border-dotted border-base-300/70 mx-2 md:mx-4"
            ></div>
            <div class="shrink-0">
              <p
                class="text-right font-mono text-base md:text-xl lg:text-2xl whitespace-nowrap"
              >
                {{ formatCurrency(getPaymentAmountForDue(due) || 0) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Préstamos -->
        <div v-if="loanDues.length > 0">
          <h4
            class="text-lg md:text-2xl font-semibold mb-2 md:mb-3 pb-2 border-b-2 border-base-300/70"
          >
            Préstamos
          </h4>
          <div
            v-for="due in loanDues"
            :key="due.originalIndex"
            class="py-2 md:py-3"
          >
            <div class="flex items-baseline gap-2">
              <p
                class="font-semibold text-base md:text-xl flex-1 min-w-0 wrap-break-word"
              >
                {{ due.description }}
              </p>
              <div
                class="hidden md:block grow border-b-2 border-dotted border-base-300/70 mx-2 md:mx-4"
              ></div>
              <div class="shrink-0 flex items-center gap-1 md:gap-2">
                <button
                  type="button"
                  @click="$emit('edit-payment', due.originalIndex)"
                  class="btn btn-ghost btn-xs no-print"
                >
                  Editar
                </button>
                <p
                  class="text-right font-mono text-base md:text-xl lg:text-2xl whitespace-nowrap"
                >
                  {{ formatCurrency(getPaymentAmountForDue(due) || 0) }}
                </p>
              </div>
            </div>
            <div
              v-if="due.details"
              class="w-full pl-2 md:pl-4 mt-2 space-y-1 text-sm md:text-base text-base-content/80 border-l-2 border-base-300/80"
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
                  }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Otros Aportes -->
        <div>
          <div class="flex justify-between items-center flex-wrap gap-2">
            <h4
              class="text-lg md:text-2xl font-semibold mb-2 md:mb-3 pb-2 border-b-2 border-base-300/70"
            >
              Otros Aportes
            </h4>
            <button
              type="button"
              @click="$emit('add-fine')"
              class="btn btn-sm btn-outline btn-accent no-print"
            >
              + Otro pago
            </button>
          </div>
          <div v-if="otherDues.length > 0">
            <div
              v-for="due in otherDues"
              :key="due.originalIndex"
              class="flex items-baseline py-2 md:py-3 gap-2"
            >
              <p
                class="font-semibold text-base md:text-xl flex-1 min-w-0 wrap-break-word"
              >
                {{ due.description }}
              </p>
              <div
                class="hidden md:block grow border-b-2 border-dotted border-base-300/70 mx-2 md:mx-4"
              ></div>
              <div class="shrink-0 flex items-center gap-1 md:gap-2">
                <div class="hidden md:block text-right">
                  <template v-if="due.type === 'fee'">
                    <button
                      type="button"
                      @click="$emit('edit-payment', due.originalIndex)"
                      class="btn btn-ghost btn-xs no-print"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      @click="$emit('delete-payment', due.originalIndex)"
                      class="btn btn-ghost btn-xs text-error no-print"
                    >
                      Borrar
                    </button>
                  </template>
                </div>
                <div class="md:hidden flex gap-1">
                  <template v-if="due.type === 'fee'">
                    <button
                      type="button"
                      @click="$emit('edit-payment', due.originalIndex)"
                      class="btn btn-ghost btn-xs p-1 no-print"
                      aria-label="Editar pago"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      @click="$emit('delete-payment', due.originalIndex)"
                      class="btn btn-ghost btn-xs text-error p-1 no-print"
                      aria-label="Eliminar pago"
                    >
                      🗑️
                    </button>
                  </template>
                </div>
                <p
                  class="text-right font-mono text-base md:text-xl lg:text-2xl whitespace-nowrap"
                >
                  {{ formatCurrency(getPaymentAmountForDue(due) || 0) }}
                </p>
              </div>
            </div>
          </div>
          <p v-else class="text-xs md:text-sm text-base-content/50 italic mt-2">
            Sin aportes adicionales.
          </p>
        </div>

        <!-- Novedades -->
        <div class="mt-4 md:mt-8">
          <div class="flex justify-between items-center flex-wrap gap-2">
            <h4
              class="text-lg md:text-2xl font-semibold mb-2 md:mb-3 pb-2 border-b-2 border-base-300/70 text-error"
            >
              Novedades
            </h4>
            <button
              type="button"
              @click="$emit('add-novelty')"
              class="btn btn-sm btn-outline btn-error no-print"
            >
              + Novedad
            </button>
          </div>
          <div v-if="noveltyPayments.length > 0">
            <div
              v-for="(novelty, idx) in noveltyPayments"
              :key="idx"
              class="flex items-baseline py-2 md:py-3 text-error gap-2"
            >
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-base md:text-xl wrap-break-word">
                  {{ novelty.description }}
                </p>
                <p
                  v-if="novelty.noveltyComment"
                  class="text-xs md:text-sm italic wrap-break-word"
                >
                  {{ novelty.noveltyComment }}
                </p>
                <p
                  v-if="novelty.affectedPaymentType"
                  class="text-xs text-error/70 mt-1 wrap-break-word"
                >
                  Afecta: {{ getAffectedPaymentTypeLabel(novelty.affectedPaymentType) }}
                </p>
              </div>
              <div
                class="hidden md:block grow border-b-2 border-dotted border-error/40 mx-2 md:mx-4"
              ></div>
              <div class="shrink-0 flex items-center gap-1 md:gap-2">
                <button
                  type="button"
                  @click="$emit('delete-novelty', idx)"
                  class="btn btn-ghost btn-xs text-error no-print"
                >
                  Borrar
                </button>
                <p
                  class="text-right font-mono text-base md:text-xl lg:text-2xl whitespace-nowrap"
                >
                  -{{ formatCurrency(novelty.amount) }}
                </p>
              </div>
            </div>
          </div>
          <p v-else class="text-xs md:text-sm text-error/50 italic mt-2">
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
          class="mt-6 md:mt-8 pt-4 border-t-2 border-dashed border-base-300/50 space-y-2 md:space-y-3"
        >
          <div
            class="flex items-baseline text-lg md:text-xl lg:text-2xl font-bold gap-2"
          >
            <span class="shrink-0">Total a Pagar:</span>
            <div
              class="hidden md:block grow border-b-2 border-dotted border-base-300/70 mx-2 md:mx-4"
            ></div>
            <span
              class="shrink-0 text-primary font-mono text-base md:text-xl lg:text-2xl whitespace-nowrap"
              >{{ formatCurrency(totalToPay) }}</span
            >
          </div>
          <div
            v-if="totalInterest > 0"
            class="flex items-baseline text-base md:text-lg text-base-content/80 gap-2"
          >
            <span class="shrink-0">Total Intereses:</span>
            <div
              class="hidden md:block grow border-b-2 border-dotted border-base-300/70 mx-2 md:mx-4"
            ></div>
            <span
              class="shrink-0 font-mono text-sm md:text-base whitespace-nowrap"
              >{{ formatCurrency(totalInterest) }}</span
            >
          </div>
        </div>

        <div class="mt-8 flex justify-end gap-4 no-print">
          <button
            type="button"
            class="btn btn-outline btn-lg"
            @click="$emit('print')"
            :disabled="payments.length === 0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Recibo
          </button>

          <button
            type="submit"
            class="btn btn-success btn-lg"
            :disabled="isSubmitting || payments.length === 0"
          >
            <span v-if="isSubmitting" class="loading loading-spinner"></span>
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

