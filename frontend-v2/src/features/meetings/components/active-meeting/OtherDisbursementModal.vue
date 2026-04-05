<template>
  <dialog class="modal" :class="{ 'modal-open': show }">
    <div class="modal-box">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="$emit('cancel')">✕</button>
      <h3 class="font-bold text-2xl mb-2">{{ title }}</h3>
      <p class="mb-6 text-base-content/70">{{ subtitle }}</p>

      <div class="space-y-4">
        <!-- Description -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-lg">Descripción</span>
          </label>
          <input type="text" v-model="editableDescription" class="input input-bordered input-lg w-full" placeholder="Ej: Pago de servicios" />
        </div>

        <!-- Amount -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-lg">Monto</span>
          </label>
          <input 
            type="text" 
            :value="amountDisplay"
            @input="onAmountInput"
            @blur="onAmountBlur"
            class="input input-bordered input-lg w-full font-mono text-right" 
          />
        </div>
      </div>
      
      <div class="modal-action">
        <button class="btn btn-ghost" @click="$emit('cancel')">Cancelar</button>
        <button class="btn btn-primary" @click="saveChanges" :disabled="!isFormValid">
          Confirmar
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button @click="$emit('cancel')">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { formatMoneyInput, parseMoneyInput } from '@/shared/utils/formatters';

const props = defineProps<{
  show: boolean;
  initialData: { description: string; amount: number; } | null;
}>();

const emit = defineEmits(['cancel', 'save']);

const editableDescription = ref('');
const editableAmount = ref(0);
const amountDisplay = ref('');

const isFormValid = computed(() => {
  return editableDescription.value.trim() !== '' && editableAmount.value > 0;
});

const title = computed(() => props.initialData ? 'Editar Desembolso' : 'Otro Desembolso');
const subtitle = computed(() => props.initialData ? 'Edite los detalles del desembolso.' : 'Ingrese los detalles del desembolso.');


watch(() => props.initialData, (newData) => {
  if (newData) {
    editableDescription.value = newData.description;
    editableAmount.value = newData.amount;
    amountDisplay.value = formatMoneyInput(newData.amount);
  } else {
    // Reset for creation
    editableDescription.value = '';
    editableAmount.value = 0;
    amountDisplay.value = formatMoneyInput(0);
  }
}, { immediate: true, deep: true });

watch(editableAmount, (newValue) => {
  amountDisplay.value = formatMoneyInput(newValue);
});

function onAmountInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const rawValue = target.value;
  
  if (rawValue === '') {
    amountDisplay.value = '';
    editableAmount.value = 0;
    return;
  }

  const cleaned = rawValue.replace(/[^\d.,]/g, '');
  amountDisplay.value = cleaned;
  
  const parsed = parseMoneyInput(cleaned);
  editableAmount.value = parsed;
}

function onAmountBlur() {
  const parsed = parseMoneyInput(amountDisplay.value);
  editableAmount.value = parsed;
  amountDisplay.value = formatMoneyInput(parsed);
}

function saveChanges() {
  if (!isFormValid.value) return;
  emit('save', { 
    description: editableDescription.value, 
    amount: Number(editableAmount.value) || 0 
  });
}
</script>
