<template>
  <Modal :show="visible" title="Registrar Pago" @close="$emit('close')">
    <div v-if="loading" class="flex items-center justify-center py-8">
      <LoadingSpinner :loading="loading" message="Cargando cuotas..." />
    </div>
    
    <div v-else-if="error" class="alert alert-error">
      <ErrorMessage :error="error" />
    </div>
    
    <form v-else @submit.prevent="handleSubmit" class="space-y-4">
      <div v-if="selectedDues.length === 0" class="alert alert-info">
        <span>No hay cuotas seleccionadas. Por favor, selecciona al menos una cuota para pagar.</span>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="due in selectedDues"
          :key="due.reference_id || due.description"
          class="border rounded-lg p-4"
        >
          <div class="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-3">
            <div class="payment-item-main">
              <input
                type="checkbox"
                :checked="isSelected(due)"
                @change="toggleDue(due)"
                class="checkbox checkbox-primary cursor-pointer"
              />
              <div class="payment-item-info">
                <div class="font-semibold text-sm sm:text-base break-words mb-1">{{ due.description }}</div>
                <div class="text-xs sm:text-sm text-base-content/70 break-words leading-relaxed">
                  Monto: {{ formatCurrency(due.amount) }}
                  <span v-if="due.type === 'loan_payment' && due.details">
                    (Interés: {{ formatCurrency(due.details.interest || 0) }}, 
                    Capital: {{ formatCurrency(due.details.principal || 0) }})
                  </span>
                </div>
              </div>
            </div>
            <div class="w-full text-left sm:w-auto sm:text-right sm:min-w-[150px]">
              <div class="flex items-center justify-between sm:justify-end gap-2 mb-1">
                <label class="block text-xs sm:text-sm text-base-content/70">Monto a pagar</label>
                <button
                  v-if="due.type === 'loan_payment' && due.details"
                  type="button"
                  class="btn btn-ghost btn-xs text-[10px] h-auto min-h-0 py-0.5 px-1 bg-base-200 hover:bg-base-300 rounded font-semibold text-secondary"
                  :disabled="!isSelected(due)"
                  @click="liquidateLoanDue(due)"
                >
                  Liquidar total
                </button>
              </div>
              <input
                v-model.number="paymentAmounts[getDueKey(due)]"
                type="number"
                step="0.01"
                min="0"
                :max="getMaxAmount(due)"
                class="w-full sm:w-36 text-right font-mono input input-bordered input-sm"
                :disabled="!isSelected(due)"
              />
              <div
                v-if="getLoanResidualWarning(due)"
                class="text-[11px] text-warning mt-1 text-right flex items-center justify-end gap-1"
              >
                <span>⚠️ Saldo: {{ formatCurrency(getLoanResidual(due)) }}</span>
                <button
                  type="button"
                  class="link link-warning font-semibold underline"
                  @click="liquidateLoanDue(due)"
                >
                  Liquidar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Comentario de novedad (opcional)</span>
        </label>
        <textarea
          v-model="noveltyComment"
          class="textarea textarea-bordered"
          rows="3"
          placeholder="Ingrese un comentario sobre este pago..."
        ></textarea>
      </div>

      <div v-if="totalAmount > 0" class="alert alert-info">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <span class="font-semibold text-sm sm:text-base">Total a pagar:</span>
          <span class="text-lg sm:text-xl font-bold font-mono break-words">{{ formatCurrency(totalAmount) }}</span>
        </div>
      </div>
    </form>

    <template #footer>
      <button class="btn btn-ghost" @click="$emit('close')">Cancelar</button>
      <button
        class="btn btn-primary"
        :disabled="selectedDues.length === 0 || totalAmount === 0 || submitting"
        @click="handleSubmit"
      >
        <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
        {{ submitting ? 'Registrando...' : 'Registrar Pago' }}
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '@/shared/components/Modal.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import { formatCurrency } from '@/shared/utils/formatters'
import type { MemberDue, RecordMonthlyPaymentsRequest } from '@/api/members.api'
import { membersApi } from '@/api/members.api'

const props = defineProps<{
  visible: boolean
  memberId: string
  dues: MemberDue[]
  meetingId?: string
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const submitting = ref(false)
const selectedDuesIds = ref<Set<string>>(new Set())
const paymentAmounts = ref<Record<string, number>>({})
const noveltyComment = ref('')

const selectedDues = computed(() => {
  return props.dues.filter(due => isSelected(due))
})

const totalAmount = computed(() => {
  return selectedDues.value.reduce((sum, due) => {
    const key = getDueKey(due)
    const amount = paymentAmounts.value[key] || due.amount
    return sum + amount
  }, 0)
})

function getDueKey(due: MemberDue): string {
  return due.reference_id || due.description || String(due.amount)
}

function isSelected(due: MemberDue): boolean {
  return selectedDuesIds.value.has(getDueKey(due))
}

function toggleDue(due: MemberDue) {
  const key = getDueKey(due)
  if (selectedDuesIds.value.has(key)) {
    selectedDuesIds.value.delete(key)
    delete paymentAmounts.value[key]
  } else {
    selectedDuesIds.value.add(key)
    paymentAmounts.value[key] = due.amount
  }
}

function getMaxAmount(due: MemberDue): number {
  if (due.type === 'loan_payment' && due.details?.outstanding_balance !== undefined) {
    return Number(((due.details.outstanding_balance || 0) + (due.details.interest || 0)).toFixed(2))
  }
  return due.amount
}

function liquidateLoanDue(due: MemberDue) {
  if (!isSelected(due)) {
    toggleDue(due)
  }
  const key = getDueKey(due)
  paymentAmounts.value[key] = getMaxAmount(due)
}

function getLoanResidual(due: MemberDue): number {
  if (due.type !== 'loan_payment' || due.details?.outstanding_balance === undefined) return 0
  const key = getDueKey(due)
  const paid = paymentAmounts.value[key] ?? due.amount
  const interest = due.details.interest || 0
  const principalPaid = Math.max(0, paid - interest)
  const residual = (due.details.outstanding_balance || 0) - principalPaid
  return Number(residual.toFixed(2))
}

function getLoanResidualWarning(due: MemberDue): boolean {
  if (!isSelected(due) || due.type !== 'loan_payment') return false
  const residual = getLoanResidual(due)
  return residual > 0.001 && residual <= 10
}

async function handleSubmit() {
  if (selectedDues.value.length === 0 || totalAmount.value === 0) return

  submitting.value = true
  error.value = null

  try {
    const payments: RecordMonthlyPaymentsRequest['payments'] = selectedDues.value.map(due => {
      const key = getDueKey(due)
      const amount = paymentAmounts.value[key] || due.amount
      
      const payment: any = {
        type: due.type,
        amount: amount,
        description: due.description,
      }

      if (due.reference_id) {
        payment.reference_id = due.reference_id
      }

      if (noveltyComment.value.trim()) {
        payment.novelty_comment = noveltyComment.value.trim()
      }

      if (due.type === 'loan_payment' && getLoanResidual(due) <= 0.001) {
        payment.is_full_payoff = true
      }

      return payment
    })

    await membersApi.recordMonthlyPayment(props.memberId, {
      payments,
      meeting_id: props.meetingId
    })

    emit('success')
    emit('close')
    resetForm()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al registrar el pago'
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  selectedDuesIds.value.clear()
  paymentAmounts.value = {}
  noveltyComment.value = ''
  error.value = null
}

watch(() => props.visible, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})
</script>

<style scoped>
.payment-item-main {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
}

.payment-item-info {
  flex: 1;
  min-width: 0;
}
</style>

