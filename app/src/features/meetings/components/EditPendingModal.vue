<template>
  <dialog :open="show" class="modal modal-open">
    <form method="dialog" class="modal-box border-2 border-info">
      <h3 class="font-bold text-lg text-info mb-2">Editar Desembolso Genérico</h3>
      <div class="mb-2">
        <span class="text-xs text-base-content/70">Socio:</span>
        <span class="font-semibold ml-2">{{ member.name }}</span>
      </div>
      <div class="mb-2">
        <span class="text-xs text-base-content/70">Tipo:</span>
        <span class="font-semibold ml-2 capitalize">{{ pendingData?.type || 'Otro' }}</span>
      </div>
      <div v-if="prevValue !== undefined" class="mb-2">
        <span class="text-xs text-base-content/70">Valor previo:</span>
        <span class="font-mono ml-2">${{ Number(prevValue).toFixed(2) }}</span>
      </div>
      <div class="mb-2">
        <label class="block text-sm font-medium mb-1">Monto</label>
        <input type="number" v-model.number="localAmount" class="input input-info input-bordered w-full" step="any" />
      </div>
      <div class="mb-2">
        <label class="block text-sm font-medium mb-1">Nota</label>
        <textarea v-model="localNote" class="textarea textarea-info w-full" rows="2" placeholder="Agrega una nota opcional..."></textarea>
      </div>
      <div class="modal-action">
        <button type="button" class="btn btn-ghost" @click.prevent="$emit('cancel')">Cancelar</button>
        <button type="button" class="btn btn-info" @click.prevent="save">Guardar</button>
      </div>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
const props = defineProps({
  show: Boolean,
  member: { type: Object, required: true },
  pendingData: { type: Object, required: true },
  prevValue: { type: Number, required: false }
})
const emit = defineEmits(['save', 'cancel'])
const localAmount = ref(props.pendingData?.amount ?? 0)
const localNote = ref(props.pendingData?.note ?? '')
watch(() => props.pendingData, (newVal) => {
  localAmount.value = newVal?.amount ?? 0
  localNote.value = newVal?.note ?? ''
})
function save() {
  emit('save', { ...props.pendingData, amount: localAmount.value, note: localNote.value })
}
</script> 