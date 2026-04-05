<template>
  <dialog class="modal" :class="{ 'modal-open': visible }">
    <div class="modal-box">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeModal">✕</button>
      <h3 class="font-bold text-2xl mb-2">Editar Pago de Préstamo</h3>
      <p class="mb-6 text-base-content/70">Ajuste el abono a capital para recalcular el pago total.</p>

      <div v-if="due && due.details">
        <div class="space-y-4">
          <!-- Abono a Capital (Editable) -->
          <div class="form-control">
            <label class="label">
              <span class="label-text text-lg">Abono a Capital</span>
            </label>
            <input
              type="text"
              :value="principalDisplay"
              @input="onPrincipalInput"
              @blur="onPrincipalBlur"
              class="input input-bordered input-lg w-full font-mono text-right"
            />
          </div>

          <!-- Intereses (Fijo) -->
          <div class="form-control">
            <label class="label">
              <span class="label-text text-lg">Intereses (Fijo)</span>
            </label>
            <input type="text" :value="due.details.interest?.toFixed(2) || '0.00'" class="input input-bordered input-lg w-full bg-base-200 font-mono text-right" readonly />
          </div>
        </div>

        <!-- Recalculo -->
        <div class="mt-8 p-4 bg-primary/10 rounded-box text-center">
          <p class="text-sm opacity-70">El nuevo saldo del préstamo será:</p>
          <p class="font-bold text-2xl font-mono text-primary">{{ formatCurrency(newOutstandingBalance) }}</p>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn btn-ghost" @click="closeModal">Cancelar</button>
        <button class="btn btn-primary" @click="saveChanges">
          Guardar Cambios ({{ formatCurrency(totalPayment) }})
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="closeModal">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, toRefs } from 'vue'
import type { MemberDue } from '@/api/members.api'
import { formatCurrency, formatMoneyInput, parseMoneyInput } from '@/shared/utils/formatters'

const props = defineProps<{
  visible: boolean
  due: MemberDue | null
}>()

const emit = defineEmits<{
  close: []
  save: [amount: number]
}>()

const { due } = toRefs(props)
const editablePrincipal = ref(0)
const principalDisplay = ref('')

const originalOutstandingBalance = computed(() => {
  if (!due.value || !due.value.details) return 0
  return due.value.details.outstanding_balance || 0
})

watch(due, (newDue) => {
  if (newDue && newDue.details) {
    editablePrincipal.value = newDue.details.principal || 0
    principalDisplay.value = formatMoneyInput(newDue.details.principal || 0)
  }
}, { immediate: true })

watch(editablePrincipal, (newValue) => {
  principalDisplay.value = formatMoneyInput(newValue);
});

function onPrincipalInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const rawValue = target.value;

  if (rawValue === '') {
    principalDisplay.value = '';
    editablePrincipal.value = 0;
    return;
  }

  const cleaned = rawValue.replace(/[^\d.,]/g, '');
  principalDisplay.value = cleaned;

  const parsed = parseMoneyInput(cleaned);
  editablePrincipal.value = parsed;
}

function onPrincipalBlur() {
  const parsed = parseMoneyInput(principalDisplay.value);
  editablePrincipal.value = parsed;
  principalDisplay.value = formatMoneyInput(parsed);
}

watch(editablePrincipal, (newValue) => {
  if (newValue < 0) {
    editablePrincipal.value = 0
  }
  if (newValue > originalOutstandingBalance.value) {
    editablePrincipal.value = originalOutstandingBalance.value
  }
})

const interest = computed(() => {
  return due.value?.details?.interest || 0
})

const totalPayment = computed(() => {
  return (Number(editablePrincipal.value) || 0) + interest.value
})

const newOutstandingBalance = computed(() => {
  if (!due.value || !due.value.details) return 0
  return originalOutstandingBalance.value - (Number(editablePrincipal.value) || 0)
})

function closeModal() {
  emit('close')
}

function saveChanges() {
  emit('save', totalPayment.value)
  closeModal()
}
</script>
