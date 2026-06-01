<template>
  <dialog :id="modalId" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Editar Pago Pendiente</h3>
      
      <form @submit.prevent="handleSubmit" v-if="payment">
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Monto</span>
          </label>
          <input 
            type="number" 
            step="0.01" 
            class="input input-bordered w-full" 
            v-model.number="form.amount" 
            required
          />
        </div>

        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Estado</span>
          </label>
          <select class="select select-bordered w-full" v-model="form.status" required>
            <option value="pending">Pendiente (Pending)</option>
            <option value="approved">Aprobado (Approved)</option>
            <option value="rejected">Rechazado (Rejected)</option>
            <option value="paid">Pagado (Paid)</option>
          </select>
        </div>

        <div class="form-control mb-6">
          <label class="label">
            <span class="label-text">Notas</span>
          </label>
          <textarea 
            class="textarea textarea-bordered w-full" 
            v-model="form.notes"
            placeholder="Observaciones opcionales"
          ></textarea>
        </div>

        <div class="modal-action">
          <button type="button" class="btn" @click="closeModal">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="isLoading">
            <span v-if="isLoading" class="loading loading-spinner"></span>
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="closeModal" aria-label="Cerrar modal">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PendingPayment } from '@/api/pending-payments.api'
import { usePendingPaymentsStore } from '../stores/pendingPaymentsStore'

const props = defineProps<{
  modalId: string
  payment: PendingPayment | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
}>()

const store = usePendingPaymentsStore()

const form = ref({
  amount: 0,
  status: 'pending' as 'pending' | 'approved' | 'rejected' | 'paid',
  notes: '' as string | null
})

const isLoading = ref(false)

watch(() => props.payment, (newVal) => {
  if (newVal) {
    form.value = {
      amount: newVal.amount,
      status: newVal.status,
      notes: newVal.notes || ''
    }
  }
}, { immediate: true })

const closeModal = () => {
  const dialog = document.getElementById(props.modalId) as HTMLDialogElement
  if (dialog) dialog.close()
  emit('close')
}

const handleSubmit = async () => {
  if (!props.payment) return
  
  isLoading.value = true
  try {
    await store.updatePayment(props.payment.id, {
      amount: form.value.amount,
      status: form.value.status,
      notes: form.value.notes ? form.value.notes : null
    })
    closeModal()
    emit('updated')
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// Para uso externo si necesitamos forzar abrir
defineExpose({
  open() {
    const dialog = document.getElementById(props.modalId) as HTMLDialogElement
    if (dialog) dialog.showModal()
  }
})
</script>
