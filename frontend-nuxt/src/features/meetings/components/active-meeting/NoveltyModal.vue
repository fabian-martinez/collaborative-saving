<template>
  <dialog class="modal" :class="{ 'modal-open': visible }">
    <div class="modal-box">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeModal">✕</button>
      <h3 class="font-bold text-2xl mb-2 text-error">Registrar Novedad</h3>
      <p class="mb-6 text-base-content/70">Este valor se restará del total recaudado.</p>

      <form @submit.prevent="onSave" class="space-y-4">
        <!-- Amount -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-lg">Monto</span>
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-error text-lg font-bold">-</span>
            <input
              :value="amountDisplay"
              @input="onAmountInput"
              @blur="onAmountBlur"
              type="text"
              class="input input-bordered input-lg w-full font-mono text-right pl-8"
              required
            />
          </div>
        </div>

        <!-- Comment -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-lg">Comentario</span>
          </label>
          <textarea 
            v-model="comment" 
            class="textarea textarea-bordered w-full" 
            placeholder="Ingrese un comentario sobre la novedad"
            required
          ></textarea>
        </div>

        <!-- Affected Payment -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-lg">¿Afecta algún pago específico? (Opcional)</span>
          </label>
          <select
            v-model="selectedDueIndex"
            class="select select-bordered w-full"
          >
            <option :value="null">Ninguno (Novedad general)</option>
            <option
              v-for="(due, index) in availableDuesFiltered"
              :key="index"
              :value="index"
            >
              {{ getDueLabel(due) }}
            </option>
          </select>
          <label class="label">
            <span class="label-text-alt text-base-content/70">Selecciona el pago que se ve afectado por esta novedad.</span>
          </label>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="closeModal">Cancelar</button>
          <button type="submit" class="btn btn-error" :disabled="!isFormValid">
            Guardar
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="closeModal">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { formatMoneyInput, parseMoneyInput } from '@/shared/utils/formatters'
import type { MemberDue } from '@/api/members.api'

const props = defineProps<{ 
  visible: boolean
  availableDues?: MemberDue[]
}>()

const emit = defineEmits<{
  close: []
  save: [data: { amount: number; comment: string; affectedDue?: MemberDue | null }]
}>()

const amount = ref<number | null>(null)
const amountDisplay = ref('')
const comment = ref('')
const selectedDueIndex = ref<number | null>(null)

const isFormValid = computed(() => {
  return amount.value !== null && amount.value > 0 && comment.value.trim() !== ''
})

// Filtrar dues disponibles (excluir novedades)
const availableDuesFiltered = computed(() => {
  if (!props.availableDues) return []
  return props.availableDues.filter(due => due.type !== 'novelty')
})

// Función para obtener etiqueta descriptiva del due
function getDueLabel(due: MemberDue): string {
  const typeLabels: Record<string, string> = {
    mandatory_contribution: 'Aporte obligatorio',
    stock_fee: 'Cuota de acciones',
    loan_payment: 'Pago de préstamo',
    fee: 'Multa/otro pago',
    insurance: 'Seguro de deuda',
  }
  
  const typeLabel = typeLabels[due.type] || due.type
  return `${typeLabel}: ${due.description}`
}

function closeModal() {
  emit('close')
}

function onSave() {
  if (!isFormValid.value) return
  
  const affectedDue = selectedDueIndex.value !== null && availableDuesFiltered.value
    ? availableDuesFiltered.value[selectedDueIndex.value]
    : null
  
  emit('save', { 
    amount: Math.abs(amount.value!), 
    comment: comment.value,
    affectedDue 
  })
  
  // Reset form
  amount.value = null
  amountDisplay.value = ''
  comment.value = ''
  selectedDueIndex.value = null
}

watch(() => props.visible, (val) => {
  if (!val) {
    amount.value = null
    amountDisplay.value = ''
    comment.value = ''
    selectedDueIndex.value = null
  } else {
    // Inicializar cuando se abre el modal
    amountDisplay.value = ''
  }
})

function onAmountInput(event: Event) {
  const target = event.target as HTMLInputElement
  const rawValue = target.value
  
  if (rawValue === '') {
    amountDisplay.value = ''
    amount.value = null
    return
  }

  // Remover caracteres no numéricos excepto punto y coma
  const cleaned = rawValue.replace(/[^\d.,]/g, '')
  
  // Parsear el valor para obtener el número
  const parsed = parseMoneyInput(cleaned)
  amount.value = parsed
  
  // Formatear el valor para mostrar puntos de miles mientras se escribe
  if (cleaned === '' || cleaned === ',' || cleaned.endsWith(',')) {
    // Permitir escribir la coma decimal
    amountDisplay.value = cleaned
  } else {
    // Formatear con puntos de miles
    const formatted = formatMoneyInput(parsed)
    amountDisplay.value = formatted
  }
}

function onAmountBlur() {
  const parsed = parseMoneyInput(amountDisplay.value)
  amount.value = parsed
  amountDisplay.value = formatMoneyInput(parsed)
}
</script>

