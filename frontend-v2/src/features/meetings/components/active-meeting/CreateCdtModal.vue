<template>
  <dialog v-if="visible" class="modal" :class="{ 'modal-open': visible }">
    <div class="modal-box">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="$emit('cancel')" aria-label="Cerrar modal">✕</button>
      <h3 class="font-bold text-2xl mb-2 text-center">Crear CDT</h3>
      <p class="mb-6 text-base-content/70 text-center">
        Ingresa el monto del CDT y el plazo en meses.
      </p>
      <form @submit.prevent="handleSave" class="space-y-4">
        <!-- Monto -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-lg">Monto</span>
          </label>
          <input 
            :value="amountDisplay"
            @input="onAmountInput"
            @blur="onAmountBlur"
            type="text" 
            class="input input-bordered input-lg w-full font-mono text-right" 
            placeholder="Monto a invertir" 
            required
          />
        </div>
        <!-- Plazo -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-lg">Plazo (meses)</span>
          </label>
          <input v-model.number="form.termMonths" type="number" min="1" max="60" step="1" class="input input-bordered input-lg w-full font-mono text-right" required />
          <label class="label">
            <span class="label-text-alt text-warning flex items-center gap-1"><span class="font-bold">1.5% interés fijo</span> de rendimiento.</span>
          </label>
        </div>
        <!-- Feedback de error -->
        <div v-if="errorMsg" class="alert alert-error mt-2">{{ errorMsg }}</div>
        <!-- Acciones -->
        <div class="modal-action flex justify-end gap-2 mt-6">
          <button type="button" class="btn btn-ghost" @click="$emit('cancel')">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="!canSave">
            Crear
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
import { formatMoneyInput, parseMoneyInput } from '@/shared/utils/formatters'

interface LocalLineCdt {
  isCdt: true
  amount: number
  termMonths: number
  stockId: 'CDT' // Un valor ficticio para compatibilidad con la vista
  quantity: 1
}

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  save: [line: LocalLineCdt]
  cancel: []
}>()

const form = ref<{
  amount: number
  termMonths: number
}>({
  amount: 0,
  termMonths: 6,
})

const amountDisplay = ref('')
const errorMsg = ref('')

watch(() => props.visible, (val) => {
  if (val) {
    form.value = {
      amount: 0,
      termMonths: 6,
    }
    amountDisplay.value = ''
    errorMsg.value = ''
  }
})

watch(() => form.value.amount, (newValue) => {
  amountDisplay.value = formatMoneyInput(newValue || 0);
});

function onAmountInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const rawValue = target.value;
  
  if (rawValue === '') {
    amountDisplay.value = '';
    form.value.amount = 0;
    return;
  }

  const cleaned = rawValue.replace(/[^\d.,]/g, '');
  amountDisplay.value = cleaned;
  
  const parsed = parseMoneyInput(cleaned);
  form.value.amount = parsed;
}

function onAmountBlur() {
  const parsed = parseMoneyInput(amountDisplay.value);
  form.value.amount = parsed;
  amountDisplay.value = formatMoneyInput(parsed);
}

const canSave = computed(() => {
  return (
    form.value.amount > 0 &&
    form.value.termMonths > 0 &&
    Number.isInteger(form.value.termMonths)
  )
})

function handleSave() {
  errorMsg.value = ''
  if (!canSave.value) {
    errorMsg.value = 'Completa todos los campos correctamente.'
    return
  }
  
  const line: LocalLineCdt = {
    isCdt: true,
    amount: form.value.amount,
    termMonths: form.value.termMonths,
    stockId: 'CDT',
    quantity: 1,
  }
  
  emit('save', line)
}
</script>
