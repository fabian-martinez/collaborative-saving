<template>
  <Modal :show="visible" title="Registrar Pago" @close="$emit('close')">
    <div v-if="loading" class="flex items-center justify-center py-8">
      <LoadingSpinner message="Cargando cuotas..." />
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
          <div class="flex items-start gap-3">
            <input
              type="checkbox"
              :checked="isSelected(due)"
              @change="toggleDue(due)"
              class="checkbox checkbox-primary mt-1"
            />
            <div class="flex-1">
              <div class="font-semibold">{{ due.description }}</div>
              <div class="text-sm text-gray-600 mt-1">
                Monto: {{ formatCurrency(due.amount) }}
                <span v-if="due.type === 'loan_payment' && due.details">
                  (Interés: {{ formatCurrency(due.details.interest || 0) }}, 
                  Capital: {{ formatCurrency(due.details.principal || 0) }})
                </span>
              </div>
            </div>
            <div class="text-right">
              <label class="text-sm text-gray-600">Monto a pagar</label>
              <input
                v-model.number="paymentAmounts[getDueKey(due)]"
                type="number"
                step="0.01"
                min="0"
                :max="due.amount"
                class="input input-bordered w-32 mt-1 text-right font-mono"
                :disabled="!isSelected(due)"
              />
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
        <div class="flex justify-between items-center">
          <span class="font-semibold">Total a pagar:</span>
          <span class="text-xl font-bold font-mono">{{ formatCurrency(totalAmount) }}</span>
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
.checkbox {
  cursor: pointer;
}
</style>

