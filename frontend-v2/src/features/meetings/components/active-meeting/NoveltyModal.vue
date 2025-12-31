<template>
  <dialog v-if="visible" class="modal modal-open">
    <form method="dialog" class="modal-box" @submit.prevent="onSave">
      <h3 class="font-bold text-lg mb-4 text-error">Registrar Novedad</h3>
      <div class="mb-4">
        <label class="block mb-1">Monto</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-error text-lg">-</span>
          <input
            v-model.number="amount"
            type="number"
            min="0.01"
            step="any"
            class="input input-bordered w-full pl-8"
            required
          />
        </div>
        <small class="text-error">Este valor se restará del total recaudado.</small>
      </div>
      <div class="mb-4">
        <label class="block mb-1">Comentario</label>
        <textarea v-model="comment" class="textarea textarea-bordered w-full" required></textarea>
      </div>
      <div class="modal-action">
        <button type="button" class="btn" @click.prevent="emit('close')">Cancelar</button>
        <button type="submit" class="btn btn-error">Guardar</button>
      </div>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  close: []
  save: [data: { amount: number; comment: string }]
}>()

const amount = ref<number | null>(null)
const comment = ref('')

function onSave() {
  if (!amount.value || !comment.value) return
  emit('save', { amount: Math.abs(amount.value), comment: comment.value })
  amount.value = null
  comment.value = ''
}

watch(() => props.visible, (val) => {
  if (!val) {
    amount.value = null
    comment.value = ''
  }
})
</script>

