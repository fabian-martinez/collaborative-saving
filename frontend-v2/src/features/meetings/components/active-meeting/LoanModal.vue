<template>
  <dialog class="modal" :class="{ 'modal-open': show }">
    <div class="modal-box max-w-lg">
      <h3 class="font-bold text-lg mb-4">{{ prevLoan && prevLoan.loanInfo ? 'Editar Desembolso de Préstamo' : 'Registrar Préstamo' }} para {{ member?.name }}</h3>
      
      <!-- Información del préstamo cuando se está editando -->
      <div v-if="prevLoan && prevLoan.loanInfo" class="alert alert-info mb-4">
        <div class="text-sm">
          <div class="font-semibold mb-2">Información del Préstamo:</div>
          <div class="space-y-1">
            <div>Valor Aprobado: <span class="font-mono font-bold">{{ formatCurrency(prevLoan.approved) }}</span></div>
            <div>Ya Desembolsado: <span class="font-mono font-bold">{{ formatCurrency(prevLoan.loanInfo.disbursed) }}</span></div>
            <div>Pendiente por Entregar: <span class="font-mono font-bold text-warning">{{ formatCurrency(prevLoan.loanInfo.pending) }}</span></div>
            <div v-if="prevLoan.loanInfo.creationDate" class="text-xs text-base-content/70 mt-2">
              Fecha de creación: {{ formatDate(new Date(prevLoan.loanInfo.creationDate)) }}
            </div>
            <div class="text-xs text-base-content/70">
              Estado: {{ prevLoan.loanInfo.status }}
            </div>
          </div>
        </div>
      </div>
      
      <form @submit.prevent="onSubmit">
        <div class="mb-4">
          <label class="block font-semibold mb-1">Tipo de Préstamo</label>
          <select v-model="form.type" class="select select-bordered w-full">
            <option value="corriente">Corriente (1.5%)</option>
            <option value="agil">Ágil (2%)</option>
            <option value="prioritario">Prioritario (2%)</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block font-semibold mb-1">Valor Aprobado</label>
          <input 
            type="text" 
            :value="approvedDisplay"
            @input="onApprovedInput"
            @blur="onApprovedBlur"
            class="input input-bordered w-full font-mono text-right" 
          />
        </div>
        
        <div class="mb-4">
          <label class="label cursor-pointer justify-start gap-3">
            <input type="checkbox" v-model="autoMatchAmount" class="checkbox checkbox-primary" />
            <span class="label-text">Igualar valor entregado al valor aprobado</span>
          </label>
        </div>
        
        <div class="mb-4">
          <label class="block font-semibold mb-1">Valor Entregado</label>
          <input 
            type="text" 
            :value="deliveredDisplay"
            @input="onDeliveredInput"
            @blur="onDeliveredBlur"
            class="input input-bordered w-full font-mono text-right" 
            :disabled="autoMatchAmount"
          />
        </div>
        <div class="mb-4">
          <label class="block font-semibold mb-1">Tasa de Interés</label>
          <input type="text" :value="interestRate + '%'" class="input input-bordered w-full" disabled />
        </div>
        <div class="mb-4">
          <label class="block font-semibold mb-1">Capacidad Máxima de Endeudamiento</label>
          <input type="text" :value="formatCurrency(maxCapacity)" class="input input-bordered w-full" disabled />
        </div>
        <div v-if="formError" class="alert alert-error my-2">
          <span>{{ formError }}</span>
        </div>
        <div class="modal-action flex justify-between items-center">
          <button class="btn btn-outline" type="button" @click="$emit('cancel')">Cancelar</button>
          <button class="btn btn-primary" type="submit">Registrar Préstamo</button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click.prevent="$emit('cancel')">Cerrar</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Member } from '@/api/members.api'
import { formatCurrency, formatMoneyInput, parseMoneyInput, formatDate } from '@/shared/utils/formatters'

const props = defineProps<{
  show: boolean,
  member: Member | null,
  maxCapacity: number,
  prevLoan?: { 
    type: string
    approved: number
    delivered: number
    loanInfo?: {
      disbursed: number
      pending: number
      creationDate: string | Date
      status: string
    }
  } | null
}>()

const emit = defineEmits(['save', 'cancel'])

const form = ref({
  type: 'corriente',
  approved: 0,
  delivered: 0,
})

const approvedDisplay = ref('')
const deliveredDisplay = ref('')
const autoMatchAmount = ref(true)

const formError = ref('')

const interestRate = computed(() => form.value.type === 'corriente' ? 1.5 : 2)

watch(
  () => [props.show, props.prevLoan, props.member],
  ([show, prevLoan]) => {
    if (show) {
      if (
        prevLoan &&
        typeof prevLoan === 'object' &&
        'type' in prevLoan &&
        'approved' in prevLoan &&
        'delivered' in prevLoan
      ) {
        form.value = { ...prevLoan } as any;
        approvedDisplay.value = formatMoneyInput(prevLoan.approved);
        
        // Si hay información del préstamo y hay pendiente, sugerir el pendiente
        if (prevLoan.loanInfo && prevLoan.loanInfo.pending > 0) {
          form.value.delivered = prevLoan.loanInfo.pending;
          deliveredDisplay.value = formatMoneyInput(prevLoan.loanInfo.pending);
          autoMatchAmount.value = false; // No auto-igualar si hay pendiente
        } else {
          deliveredDisplay.value = formatMoneyInput(prevLoan.delivered);
          autoMatchAmount.value = prevLoan.approved === prevLoan.delivered;
        }
      } else {
        form.value = { type: 'corriente', approved: 0, delivered: 0 };
        approvedDisplay.value = formatMoneyInput(0);
        deliveredDisplay.value = formatMoneyInput(0);
        autoMatchAmount.value = true; // Por defecto activado
      }
      formError.value = '';
    }
  },
  { immediate: true }
)

watch(() => form.value.approved, (newValue) => {
  approvedDisplay.value = formatMoneyInput(newValue);
});

watch(() => form.value.delivered, (newValue) => {
  if (!autoMatchAmount.value) {
    deliveredDisplay.value = formatMoneyInput(newValue);
  }
});

// Cuando autoMatchAmount está activado, igualar delivered con approved
watch([autoMatchAmount, () => form.value.approved], ([isAuto, approved]) => {
  if (isAuto) {
    form.value.delivered = approved;
    deliveredDisplay.value = formatMoneyInput(approved);
  }
}, { immediate: true });

function onApprovedInput(event: Event) {
  const target = event.target as HTMLInputElement
  const rawValue = target.value
  
  if (rawValue === '') {
    approvedDisplay.value = ''
    form.value.approved = 0
    if (autoMatchAmount.value) {
      form.value.delivered = 0
      deliveredDisplay.value = formatMoneyInput(0)
    }
    return
  }

  const cleaned = rawValue.replace(/[^\d.,]/g, '')
  approvedDisplay.value = cleaned
  
  const parsed = parseMoneyInput(cleaned)
  form.value.approved = parsed
  
  // Si autoMatchAmount está activo, actualizar también delivered
  if (autoMatchAmount.value) {
    form.value.delivered = parsed
    deliveredDisplay.value = formatMoneyInput(parsed)
  }
}

function onApprovedBlur() {
  const parsed = parseMoneyInput(approvedDisplay.value)
  form.value.approved = parsed
  approvedDisplay.value = formatMoneyInput(parsed)
  
  // Si autoMatchAmount está activo, actualizar también delivered
  if (autoMatchAmount.value) {
    form.value.delivered = parsed
    deliveredDisplay.value = formatMoneyInput(parsed)
  }
}

function onDeliveredInput(event: Event) {
  if (autoMatchAmount.value) return;
  
  const target = event.target as HTMLInputElement
  const rawValue = target.value
  
  if (rawValue === '') {
    deliveredDisplay.value = ''
    form.value.delivered = 0
    return
  }

  const cleaned = rawValue.replace(/[^\d.,]/g, '')
  deliveredDisplay.value = cleaned
  
  const parsed = parseMoneyInput(cleaned)
  form.value.delivered = parsed
}

function onDeliveredBlur() {
  if (autoMatchAmount.value) return;
  
  const parsed = parseMoneyInput(deliveredDisplay.value)
  form.value.delivered = parsed
  deliveredDisplay.value = formatMoneyInput(parsed)
}

function onSubmit() {
  formError.value = ''
  if (form.value.approved <= 0) {
    formError.value = 'El valor aprobado debe ser mayor a 0.'
    return
  }
  if (form.value.delivered <= 0) {
    formError.value = 'El valor entregado debe ser mayor a 0.'
    return
  }
  if (form.value.delivered > form.value.approved) {
    formError.value = 'El valor entregado no puede superar el valor aprobado.'
    return
  }
  
  emit('save', { ...form.value })
}
</script>
