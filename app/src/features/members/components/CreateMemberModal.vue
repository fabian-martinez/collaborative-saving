<template>
  <dialog ref="modalElement" class="modal" @close="handleClose">
    <div class="modal-box">
      <h3 class="font-bold text-lg">{{ modalTitle }}</h3>
      <form @submit.prevent="handleSubmit" class="py-4 space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Nombre Completo</span>
          </label>
          <input
            v-model="memberData.name"
            type="text"
            placeholder="Ej: Ada Lovelace"
            class="input input-bordered w-full"
            required
          />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Cédula de Identidad</span>
          </label>
          <input
            v-model="memberData.identificationNumber"
            type="text"
            placeholder="Ej: 123456789"
            class="input input-bordered w-full"
          />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Email</span>
          </label>
          <input
            v-model="memberData.email"
            type="email"
            placeholder="Ej: ada.lovelace@example.com"
            class="input input-bordered w-full"
            required
          />
        </div>

        <div class="modal-action">
          <button type="button" class="btn" @click="closeModal">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="loading loading-spinner"></span>
            {{ submitButtonText }}
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="closeModal">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { api } from '@/services/api'
import type { Member } from '@/features/members/types'

const props = defineProps<{
  modelValue: boolean
  memberToEdit: Member | null
}>()

const emit = defineEmits(['update:modelValue', 'member-created', 'member-updated'])

const modalElement = ref<HTMLDialogElement | null>(null)
const isSubmitting = ref(false)
const memberData = ref({
  name: '',
  email: '',
  identificationNumber: '',
})

const isEditMode = computed(() => !!props.memberToEdit)
const modalTitle = computed(() => (isEditMode.value ? 'Actualizar Socio' : 'Añadir Nuevo Socio'))
const submitButtonText = computed(() => (isEditMode.value ? 'Guardar Cambios' : 'Crear Socio'))

watch(() => props.modelValue, (show) => {
  if (show) {
    if (isEditMode.value && props.memberToEdit) {
      memberData.value = { ...props.memberToEdit }
    } else {
      memberData.value = { name: '', email: '', identificationNumber: '' }
    }
    modalElement.value?.showModal()
  } else {
    modalElement.value?.close()
  }
})

function closeModal() {
  emit('update:modelValue', false)
}

function handleClose() {
  emit('update:modelValue', false)
}

async function handleSubmit() {
  isSubmitting.value = true
  try {
    if (isEditMode.value && props.memberToEdit) {
      await api.patch(`/members/${props.memberToEdit.id}`, memberData.value)
      emit('member-updated')
    } else {
      await api.post('/members', memberData.value)
      emit('member-created')
    }
    closeModal()
  } catch (e: unknown) {
    console.error('Failed to save member:', e)
    const message = e instanceof Error ? e.message : 'An unknown error occurred.'
    alert(`Error al guardar el socio: ${message}`)
  } finally {
    isSubmitting.value = false
  }
}
</script> 