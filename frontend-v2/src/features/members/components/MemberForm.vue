<template>
  <form @submit.prevent="handleSubmit" class="member-form">
    <div class="form-group">
      <label>Nombre *</label>
      <input v-model="formData.name" type="text" required />
    </div>
    <div class="form-group">
      <label>Email *</label>
      <input v-model="formData.email" type="email" required />
    </div>
    <div class="form-group">
      <label>Identificación</label>
      <input v-model="formData.identification_number" type="text" />
    </div>
    <div class="form-group">
      <label>Teléfono</label>
      <input v-model="formData.phone" type="text" />
    </div>
    <div class="form-group">
      <label>Dirección</label>
      <input v-model="formData.address" type="text" />
    </div>
    <div class="form-group">
      <label>Beneficiario</label>
      <input v-model="formData.beneficiary" type="text" />
    </div>
    <div class="form-actions">
      <button type="submit" class="submit-button">Guardar</button>
      <button type="button" @click="$emit('cancel')" class="cancel-button">Cancelar</button>
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

<style scoped>
.member-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
}

.form-group input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.submit-button {
  background-color: #27ae60;
  color: white;
  padding: 0.5rem 1rem;
}

.cancel-button {
  background-color: #95a5a6;
  color: white;
  padding: 0.5rem 1rem;
}
</style>

