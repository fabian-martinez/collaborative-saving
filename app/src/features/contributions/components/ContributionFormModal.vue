<template>
  <dialog ref="modalElement" class="modal" @close="handleClose">
    <div class="modal-box">
      <h3 class="font-bold text-lg">{{ isEditing ? 'Editar Contribución' : 'Añadir Nueva Contribución' }}</h3>
      <form @submit.prevent="handleSubmit" class="py-4 space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Tipo de Activo</span>
          </label>
          <input
            v-model="editableContribution.asset_type"
            type="text"
            placeholder="Ej: Aporte Administrativo"
            class="input input-bordered w-full"
            required
          />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Monto Total (Bs.)</span>
          </label>
          <input
            v-model.number="editableContribution.total"
            type="number"
            step="0.01"
            placeholder="Ej: 10.00"
            class="input input-bordered w-full"
            required
          />
        </div>

        <div class="modal-action">
          <button type="button" class="btn" @click="closeModal">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="isLoading">
            <span v-if="isLoading" class="loading loading-spinner"></span>
            {{ isEditing ? 'Guardar Cambios' : 'Crear Contribución' }}
          </button>
        </div>
        <p v-if="error" class="text-error text-sm mt-2">{{ error }}</p>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="closeModal">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { MandatoryContribution } from '../types';
import { contributionsService } from '../services/contributionsService';

const props = defineProps<{
  modelValue: boolean;
  contributionToEdit: MandatoryContribution | null;
}>();

const emit = defineEmits(['update:modelValue', 'contribution-saved']);

const modalElement = ref<HTMLDialogElement | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const initialContributionState: Omit<MandatoryContribution, 'id'> = {
  asset_type: '',
  total: 0,
};

const editableContribution = ref({ ...initialContributionState });

const isEditing = computed(() => !!props.contributionToEdit);

watch(() => props.modelValue, (show) => {
  if (show) {
    error.value = null;
    if (props.contributionToEdit) {
      editableContribution.value = { ...props.contributionToEdit };
    } else {
      editableContribution.value = { ...initialContributionState };
    }
    modalElement.value?.showModal();
  } else {
    modalElement.value?.close();
  }
});

function closeModal() {
  emit('update:modelValue', false);
}

function handleClose() {
  emit('update:modelValue', false);
}

async function handleSubmit() {
  isLoading.value = true;
  error.value = null;
  try {
    if (isEditing.value && props.contributionToEdit) {
      await contributionsService.updateContribution(props.contributionToEdit.id, editableContribution.value);
    } else {
      await contributionsService.createContribution(editableContribution.value);
    }
    emit('contribution-saved');
    closeModal();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
    error.value = `Error: ${message}`;
    console.error('Failed to save contribution:', e);
  } finally {
    isLoading.value = false;
  }
}
</script> 