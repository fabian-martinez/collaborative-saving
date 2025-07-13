<template>
  <dialog v-if="visible" class="modal" :class="{ 'modal-open': visible }">
    <div class="modal-box">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="$emit('cancel')">✕</button>
      <h3 class="font-bold text-2xl mb-2 text-center">{{ isEditing ? 'Editar compra de acción' : 'Agregar compra de acción' }}</h3>
      <p class="mb-6 text-base-content/70 text-center">
        {{ isEditing ? 'Modifica los datos de la compra de acción seleccionada.' : 'Completa los datos para registrar una nueva compra de acción.' }}
      </p>
      <form @submit.prevent="handleSave" class="space-y-4">
        <!-- Tipo de acción -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-lg">Tipo de acción</span>
          </label>
          <select v-model="form.stockId" class="select select-bordered select-lg w-full">
            <option disabled value="">Selecciona tipo de acción</option>
            <option v-for="stock in stocks" :key="stock.id" :value="stock.id">
              {{ stock.type }} (Valor actual: ${{ stock.value.toFixed(2) }})
            </option>
          </select>
        </div>
        <!-- Cantidad -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-lg">Cantidad</span>
          </label>
          <input v-model.number="form.quantity" type="number" min="1" class="input input-bordered input-lg w-full font-mono text-right" required />
        </div>
        <!-- Método de pago -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-lg">Método de pago</span>
          </label>
          <select v-model="form.paymentMethod" class="select select-bordered select-lg w-full">
            <option value="cash">Efectivo</option>
            <option value="mixed">Mixto</option>
          </select>
          <div v-if="form.paymentMethod === 'mixed'" class="flex gap-2 mt-2">
            <input v-model.number="form.cashAmount" type="number" min="0" :max="totalAmount" step="0.01" class="input input-bordered input-lg w-1/2 font-mono text-right" placeholder="Efectivo" />
          </div>
          <div v-if="form.paymentMethod === 'mixed'" class="mt-2 text-warning text-sm flex items-center gap-1">
            <span class="font-bold">2% interés fijo</span> sobre el monto a crédito.
          </div>
        </div>
        <!-- Feedback de error -->
        <div v-if="errorMsg" class="alert alert-error mt-2">{{ errorMsg }}</div>
        <!-- Resumen dinámico de la compra -->
        <div v-if="form.stockId && form.quantity > 0" class="mt-4 p-4 bg-base-200 rounded-lg space-y-2 text-base-content/90">
          <div class="flex justify-between">
            <span class="font-semibold">Total a pagar:</span>
            <span class="font-mono text-lg">${{ totalAmount.toFixed(2) }}</span>
          </div>
          <div v-if="form.paymentMethod === 'mixed'">
            <div class="flex justify-between">
              <span>Efectivo:</span>
              <span class="font-mono">${{ (form.cashAmount || 0).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Financiado:</span>
              <span class="font-mono">${{ (totalAmount - form.cashAmount).toFixed(2) }}</span>
            </div>
          </div>
        </div>
        <!-- Acciones -->
        <div class="modal-action flex justify-end gap-2">
          <button type="button" class="btn btn-ghost" @click="$emit('cancel')">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="!canSave">
            {{ isEditing ? 'Guardar Cambios' : 'Agregar' }}
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="$emit('cancel')">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Stock } from '@/features/stocks/types'

const props = defineProps({
  visible: Boolean,
  isEditing: Boolean,
  initialData: {
    type: Object,
    default: () => ({
      stockId: '',
      quantity: 1,
      cashAmount: 0,
    })
  },
  stocks: {
    type: Array as () => Stock[],
    required: true
  }
})
const emit = defineEmits(['save', 'cancel'])

const form = ref({ ...props.initialData })
const errorMsg = ref('')

watch(() => props.initialData, (val) => {
  form.value = { ...val }
}, { immediate: true })

const totalAmount = computed(() => {
  const stock = (props.stocks as Stock[]).find((s) => s.id === form.value.stockId)
  return stock ? (form.value.quantity > 0 ? form.value.quantity * stock.value : 0) : 0
})

const canSave = computed(() => {
  return (
    form.value.stockId &&
    form.value.quantity > 0 &&
    Number.isInteger(form.value.quantity) &&
    totalAmount.value >= 0 &&
    (form.value.paymentMethod === 'cash' || form.value.paymentMethod === 'mixed')
  )
})

function handleSave() {
  errorMsg.value = ''
  if (!canSave.value) {
    errorMsg.value = 'Completa todos los campos correctamente.'
    return
  }
  if (form.value.quantity < 1 || !Number.isInteger(form.value.quantity)) {
    errorMsg.value = 'Solo se permiten cantidades enteras de acciones.'
    return
  }
  let cash = 0
  if (form.value.paymentMethod === 'cash') {
    cash = totalAmount.value
  } else if (form.value.paymentMethod === 'mixed') {
    cash = form.value.cashAmount
  }
  emit('save', {
    stockId: form.value.stockId,
    quantity: form.value.quantity,
    cashAmount: cash,
    loanDetails: {
      interest_rate: 0.02,
      loan_type: 'accion',
    },
  })
}
</script> 