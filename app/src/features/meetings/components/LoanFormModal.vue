<template>
  <dialog v-if="show" class="modal modal-open">
    <div class="modal-box max-w-lg">
      <h3 class="font-bold text-lg mb-4">Registrar Préstamo para {{ member?.name }}</h3>
      <form @submit.prevent="onSubmit">
        <div class="mb-4">
          <label class="block font-semibold mb-1">Tipo de Préstamo</label>
          <select v-model="form.type" class="select select-bordered w-full">
            <option value="corriente">Corriente (1.5%)</option>
            <option value="agil">Ágil (2%)</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block font-semibold mb-1">Valor Aprobado</label>
          <input type="number" v-model.number="form.approved" class="input input-bordered w-full" min="0" :max="maxCapacity" />
        </div>
        <div class="mb-4">
          <label class="block font-semibold mb-1">Valor Entregado</label>
          <input type="number" v-model.number="form.delivered" class="input input-bordered w-full" min="0" :max="form.approved" />
        </div>
        <div class="mb-4">
          <label class="block font-semibold mb-1">Tasa de Interés</label>
          <input type="text" :value="interestRate + '%'" class="input input-bordered w-full" disabled />
        </div>
        <div class="mb-4">
          <label class="block font-semibold mb-1">Capacidad Máxima de Endeudamiento</label>
          <input type="text" :value="'$' + maxCapacity.toFixed(2)" class="input input-bordered w-full" disabled />
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

const props = defineProps<{
  show: boolean,
  member: { id: string; name: string; maxCapacity: number } | null,
  prevLoan?: { type: string; approved: number; delivered: number } | null
}>()

const emit = defineEmits(['save', 'cancel'])

const form = ref({
  type: 'corriente',
  approved: 0,
  delivered: 0,
})

const formError = ref('')

const interestRate = computed(() => form.value.type === 'corriente' ? 1.5 : 2)
const maxCapacity = computed(() => props.member ? props.member.maxCapacity : 0)

watch(
  () => [props.show, props.prevLoan, props.member],
  ([show, prevLoan, member]) => {
    if (show) {
      if (
        prevLoan &&
        typeof prevLoan === 'object' &&
        'type' in prevLoan &&
        'approved' in prevLoan &&
        'delivered' in prevLoan
      ) {
        form.value = { ...prevLoan };
      } else {
        form.value = { type: 'corriente', approved: 0, delivered: 0 };
      }
      formError.value = '';
    }
  },
  { immediate: true }
)

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
  if (form.value.approved > maxCapacity.value) {
    formError.value = 'El valor aprobado supera la capacidad máxima de endeudamiento.'
    return
  }
  emit('save', { ...form.value })
}
</script> 