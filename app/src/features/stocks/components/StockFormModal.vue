<template>
  <dialog ref="modalElement" class="modal" @close="handleClose">
    <div class="modal-box">
      <h3 class="font-bold text-lg">{{ isEditing ? 'Editar Acción' : 'Añadir Nueva Acción' }}</h3>
      <form @submit.prevent="handleSubmit" class="py-4 space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Tipo/Nombre de la Acción</span>
          </label>
          <input
            v-model="editableStock.type"
            type="text"
            placeholder="Ej: Acción Preferencial"
            class="input input-bordered w-full"
            required
          />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Valor Actual (Bs.)</span>
          </label>
          <input
            v-model.number="editableStock.value"
            type="number"
            step="0.01"
            placeholder="Ej: 100.00"
            class="input input-bordered w-full"
            disabled
          />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Aporte Mensual (Bs.)</span>
          </label>
          <input
            v-model.number="editableStock.monthly_contribution"
            type="number"
            step="0.01"
            placeholder="Ej: 50.00"
            class="input input-bordered w-full"
            required
          />
        </div>

        <div class="modal-action">
          <button type="button" class="btn" @click="closeModal">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="isLoading">
            <span v-if="isLoading" class="loading loading-spinner"></span>
            {{ isEditing ? 'Guardar Cambios' : 'Crear Acción' }}
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
import type { Stock } from '../types';
import { stocksService } from '../services/stocksService';

const props = defineProps<{
  modelValue: boolean;
  stockToEdit: Stock | null;
}>();

const emit = defineEmits(['update:modelValue', 'stock-saved']);

const modalElement = ref<HTMLDialogElement | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const initialStockState: Omit<Stock, 'id'> = {
  type: '',
  value: 0,
  monthly_contribution: 0,
};

const editableStock = ref({ ...initialStockState });

const isEditing = computed(() => !!props.stockToEdit);

watch(() => props.modelValue, (show) => {
  if (show) {
    error.value = null;
    if (props.stockToEdit) {
      // Editing existing stock
      editableStock.value = { ...props.stockToEdit };
    } else {
      // Creating new stock
      editableStock.value = { ...initialStockState };
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
    if (isEditing.value && props.stockToEdit) {
      await stocksService.updateStock(props.stockToEdit.id, editableStock.value);
    } else {
      await stocksService.createStock(editableStock.value);
    }
    emit('stock-saved');
    closeModal();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
    error.value = `Error: ${message}`;
    console.error('Failed to save stock:', e);
  } finally {
    isLoading.value = false;
  }
}
</script> 