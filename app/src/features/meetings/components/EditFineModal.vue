<template>
  <dialog class="modal" :class="{ 'modal-open': visible }">
    <div class="modal-box">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeModal">✕</button>
      <h3 class="font-bold text-2xl mb-2">{{ title }}</h3>
      <p class="mb-6 text-base-content/70">{{ subtitle }}</p>

      <div class="space-y-4">
        <!-- Description -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-lg">Descripción</span>
          </label>
          <input type="text" v-model="editableDescription" class="input input-bordered input-lg w-full" />
        </div>

        <!-- Amount -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-lg">Monto</span>
          </label>
          <input type="number" v-model.number="editableAmount" class="input input-bordered input-lg w-full font-mono text-right" min="0.01" step="0.01" />
        </div>
      </div>
      
      <div class="modal-action">
        <button class="btn btn-ghost" @click="closeModal">Cancelar</button>
        <button class="btn btn-primary" @click="saveChanges" :disabled="!isFormValid">
          Guardar Cambios
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button @click="closeModal">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

const props = defineProps<{
  visible: boolean;
  initialData: { description: string; amount: number; } | null;
}>();

const emit = defineEmits(['close', 'save']);

const editableDescription = ref('');
const editableAmount = ref(0);

const isFormValid = computed(() => {
  return editableDescription.value.trim() !== '' && editableAmount.value > 0;
});

const title = computed(() => props.initialData ? 'Editar Aporte' : 'Añadir Multa');
const subtitle = computed(() => props.initialData ? 'Ajuste la descripción o el monto.' : 'Ingrese los detalles de la nueva multa.');


watch(() => props.initialData, (newData) => {
  if (newData) {
    editableDescription.value = newData.description;
    editableAmount.value = newData.amount;
  } else {
    // Reset for creation
    editableDescription.value = 'Multa por atraso';
    editableAmount.value = 5;
  }
}, { immediate: true, deep: true });

function closeModal() {
  emit('close');
}

function saveChanges() {
  if (!isFormValid.value) return;
  emit('save', { 
    description: editableDescription.value, 
    amount: Number(editableAmount.value) || 0 
  });
  closeModal();
}
</script> 