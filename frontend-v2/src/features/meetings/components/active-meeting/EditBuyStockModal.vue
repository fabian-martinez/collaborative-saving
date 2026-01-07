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
              {{ stock.type }} (Valor actual: <CopyOnDblClickNumber :value="stock.value" />)
            </option>
          </select>
        </div>
        <!-- Cantidad -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-lg">Cantidad</span>
          </label>
          <input v-model.number="form.quantity" type="number" min="1" step="any" class="input input-bordered input-lg w-full font-mono text-right" required />
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
            <input 
              :value="cashAmountDisplay"
              @input="onCashAmountInput"
              @blur="onCashAmountBlur"
              type="text" 
              class="input input-bordered input-lg w-1/2 font-mono text-right" 
              placeholder="Efectivo" 
            />
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
            <span class="font-mono text-lg"><CopyOnDblClickNumber :value="totalAmount" /></span>
          </div>
          <div v-if="form.paymentMethod === 'mixed'">
            <div class="flex justify-between">
              <span>Efectivo:</span>
              <span class="font-mono"><CopyOnDblClickNumber :value="form.cashAmount || 0" /></span>
            </div>
            <div class="flex justify-between">
              <span>Financiado:</span>
              <span class="font-mono"><CopyOnDblClickNumber :value="totalAmount - (form.cashAmount || 0)" /></span>
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
import type { Stock } from '@/api/stocks.api'
import CopyOnDblClickNumber from '@/shared/components/CopyOnDblClickNumber.vue'
import { formatMoneyInput, parseMoneyInput } from '@/shared/utils/formatters'

interface LocalLine {
  stockId: string
  quantity: number
  cashAmount: number
  loanDetails?: {
    interest_rate: number
    loan_type: string
  }
}

const props = defineProps<{
  visible: boolean
  isEditing: boolean
  initialData: LocalLine
  stocks: Stock[]
}>()

const emit = defineEmits<{
  save: [line: LocalLine]
  cancel: []
}>()

const form = ref<{
  stockId: string
  quantity: number
  cashAmount: number
  paymentMethod: 'cash' | 'mixed'
}>({
  stockId: props.initialData.stockId || '',
  quantity: props.initialData.quantity || 1,
  cashAmount: props.initialData.cashAmount || 0,
  paymentMethod: props.initialData.cashAmount < (props.initialData.quantity * (props.stocks.find(s => s.id === props.initialData.stockId)?.value || 0)) ? 'mixed' : 'cash'
})

const cashAmountDisplay = ref('')
const errorMsg = ref('')

watch(() => props.initialData, (val) => {
  const stockValue = props.stocks.find(s => s.id === val.stockId)?.value || 0
  const totalValue = val.quantity * stockValue
  form.value = {
    stockId: val.stockId || '',
    quantity: val.quantity || 1,
    cashAmount: val.cashAmount || 0,
    paymentMethod: val.cashAmount < totalValue ? 'mixed' : 'cash'
  }
  cashAmountDisplay.value = formatMoneyInput(val.cashAmount || 0)
}, { immediate: true })

watch(() => form.value.cashAmount, (newValue) => {
  cashAmountDisplay.value = formatMoneyInput(newValue || 0);
});

function onCashAmountInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const rawValue = target.value;
  
  if (rawValue === '') {
    cashAmountDisplay.value = '';
    form.value.cashAmount = 0;
    return;
  }

  const cleaned = rawValue.replace(/[^\d.,]/g, '');
  cashAmountDisplay.value = cleaned;
  
  const parsed = parseMoneyInput(cleaned);
  form.value.cashAmount = parsed;
}

function onCashAmountBlur() {
  const parsed = parseMoneyInput(cashAmountDisplay.value);
  form.value.cashAmount = parsed;
  cashAmountDisplay.value = formatMoneyInput(parsed);
}

const totalAmount = computed(() => {
  const stock = props.stocks.find((s) => s.id === form.value.stockId)
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
  if (form.value.paymentMethod === 'mixed' && form.value.cashAmount > totalAmount.value) {
    errorMsg.value = 'El monto en efectivo no puede ser mayor al total.'
    return
  }
  
  let cash = 0
  if (form.value.paymentMethod === 'cash') {
    cash = totalAmount.value
  } else if (form.value.paymentMethod === 'mixed') {
    cash = form.value.cashAmount || 0
  }
  
  const line: LocalLine = {
    stockId: form.value.stockId,
    quantity: form.value.quantity,
    cashAmount: cash,
  }
  
  // Solo agregar loanDetails si hay crédito (pago mixto)
  if (form.value.paymentMethod === 'mixed' && cash < totalAmount.value) {
    line.loanDetails = {
      interest_rate: 0.02,
      loan_type: 'accion',
    }
  }
  
  emit('save', line)
}
</script>

