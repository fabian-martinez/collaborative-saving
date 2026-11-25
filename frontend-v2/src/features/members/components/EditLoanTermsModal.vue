<template>
  <dialog :open="visible" class="modal" :class="{ 'modal-open': visible }">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">
        Editar Condiciones — {{ loan?.loan_type }}
      </h3>

      <div v-if="error" class="alert alert-error text-sm mb-4">
        <span>{{ error }}</span>
      </div>

      <form v-if="loan" @submit.prevent="handleSubmit" class="space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Tasa de interés (%)</span>
          </label>
          <input
            v-model.number="form.interest_rate"
            type="number"
            step="0.01"
            min="0"
            required
            class="input input-bordered w-full"
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Cuota mensual</span>
          </label>
          <input
            v-model.number="form.monthly_payment_amount"
            type="number"
            step="1"
            min="0"
            required
            class="input input-bordered w-full"
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Plazo (meses)</span>
          </label>
          <input
            v-model.number="form.term"
            type="number"
            step="1"
            min="1"
            required
            class="input input-bordered w-full"
          />
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="$emit('close')" :disabled="saving">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="$emit('close')">
      <button type="button">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { loansApi } from '@/api/loans.api'
import type { Loan } from '@/api/members.api'

const props = defineProps<{
  visible: boolean
  loan: Loan | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const saving = ref(false)
const error = ref<string | null>(null)

const form = reactive({
  interest_rate: 0,
  monthly_payment_amount: 0,
  term: 1
})

watch(
  () => props.loan,
  (loan) => {
    if (loan) {
      form.interest_rate = loan.interest_rate
      form.monthly_payment_amount = loan.monthly_payment_amount
      form.term = loan.term
      error.value = null
    }
  },
  { immediate: true }
)

async function handleSubmit() {
  if (!props.loan) return
  saving.value = true
  error.value = null
  try {
    await loansApi.updateLoanTerms(props.loan.id, {
      interest_rate: form.interest_rate,
      monthly_payment_amount: form.monthly_payment_amount,
      term: form.term
    })
    emit('saved')
    emit('close')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error al actualizar las condiciones del préstamo'
  } finally {
    saving.value = false
  }
}
</script>
