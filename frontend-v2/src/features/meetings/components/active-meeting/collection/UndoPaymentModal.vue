<!--
  Copyright 2026 Collaborative Saving Project.
  All rights reserved.
-->
<template>
  <dialog class="modal" :class="{ 'modal-open': visible }">
    <div class="modal-box max-w-md">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 class="font-bold text-lg text-error">Anular Cobro (Paso 1)</h3>
          <p class="text-xs text-base-content/70 mt-0.5">
            Socio: <span class="font-semibold text-base-content">{{ memberName }}</span>
          </p>
        </div>
        <button
          type="button"
          class="btn btn-sm btn-circle btn-ghost"
          :disabled="isSubmitting"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="bg-base-200/70 rounded-lg p-3 text-xs space-y-1 mb-4">
        <div class="flex justify-between">
          <span class="text-base-content/70">Operaciones a anular:</span>
          <span class="font-semibold">{{ operationCount }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-base-content/70">Total del cobro:</span>
          <span class="font-bold text-emerald-600">{{ formatCurrency(totalAmount) }}</span>
        </div>
      </div>

      <div class="alert alert-warning text-xs py-2.5 mb-4">
        <ul class="list-disc list-inside space-y-1">
          <li>Se eliminarán los asientos contables y el socio volverá a estado <strong>Pendiente</strong>.</li>
          <li>Si el cobro incluye abonos a créditos, el saldo del préstamo será restituido.</li>
        </ul>
      </div>

      <div class="form-control">
        <label class="label py-1">
          <span class="label-text text-xs font-semibold">
            Motivo de anulación <span class="text-error">*</span>
          </span>
          <span class="label-text-alt text-[11px] text-base-content/60">
            Mínimo 5 caracteres
          </span>
        </label>
        <textarea
          v-model="reason"
          rows="3"
          maxlength="500"
          class="textarea textarea-bordered text-sm w-full"
          placeholder="Ej. Cobro registrado con monto incorrecto..."
          :disabled="isSubmitting"
        ></textarea>
        <p v-if="reason.length > 0 && reason.trim().length < 5" class="text-error text-xs mt-1">
          Ingresa al menos 5 caracteres para describir el motivo.
        </p>
      </div>

      <div class="modal-action">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="isSubmitting"
          @click="$emit('close')"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-error btn-sm"
          :disabled="!canConfirm || isSubmitting"
          @click="handleConfirm"
        >
          <span v-if="isSubmitting" class="loading loading-spinner loading-xs"></span>
          Confirmar Anulación
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @click="!isSubmitting && $emit('close')">
      <button type="button">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatCurrency } from '@/shared/utils/formatters'

const props = withDefaults(
  defineProps<{
    visible: boolean
    memberName: string
    totalAmount: number
    operationCount: number
    isSubmitting?: boolean
  }>(),
  {
    isSubmitting: false
  }
)

const emit = defineEmits<{
  close: []
  confirm: [reason: string]
}>()

const reason = ref('')

const canConfirm = computed(() => reason.value.trim().length >= 5)

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      reason.value = ''
    }
  }
)

function handleConfirm() {
  if (!canConfirm.value || props.isSubmitting) return
  emit('confirm', reason.value.trim())
}
</script>
