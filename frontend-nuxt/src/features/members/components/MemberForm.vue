<template>
  <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
    <div class="form-control">
      <label class="label">
        <span class="label-text">Nombre *</span>
      </label>
      <input v-model="formData.name" type="text" required class="input input-bordered w-full" />
    </div>
    <div class="form-control">
      <label class="label">
        <span class="label-text">Email *</span>
      </label>
      <input v-model="formData.email" type="email" required class="input input-bordered w-full" />
    </div>
    <div class="form-control">
      <label class="label">
        <span class="label-text">Identificación</span>
      </label>
      <input v-model="formData.identification_number" type="text" class="input input-bordered w-full" />
    </div>
    <div class="form-control">
      <label class="label">
        <span class="label-text">Teléfono</span>
      </label>
      <input v-model="formData.phone" type="text" class="input input-bordered w-full" />
    </div>
    <div class="form-control">
      <label class="label">
        <span class="label-text">Dirección</span>
      </label>
      <input v-model="formData.address" type="text" class="input input-bordered w-full" />
    </div>
    <div class="form-control">
      <label class="label">
        <span class="label-text">Beneficiario</span>
      </label>
      <input v-model="formData.beneficiary" type="text" class="input input-bordered w-full" />
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button type="submit" class="btn btn-success">Guardar</button>
      <button type="button" @click="$emit('cancel')" class="btn btn-ghost">Cancelar</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { CreateMemberRequest } from '@/api/members.api'

const props = defineProps<{
  initialData?: Partial<CreateMemberRequest>
}>()

const emit = defineEmits<{
  submit: [data: CreateMemberRequest]
  cancel: []
}>()

const formData = ref<CreateMemberRequest>({
  name: props.initialData?.name || '',
  email: props.initialData?.email || '',
  identification_number: props.initialData?.identification_number || '',
  phone: props.initialData?.phone || '',
  address: props.initialData?.address || '',
  beneficiary: props.initialData?.beneficiary || '',
  role: props.initialData?.role || 'member'
})

function handleSubmit() {
  emit('submit', formData.value)
}
</script>


