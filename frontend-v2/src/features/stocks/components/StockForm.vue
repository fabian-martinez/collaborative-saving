<template>
  <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium">Nombre de la Acción *</span>
      </label>
      <input 
        v-model="formData.name" 
        type="text" 
        required 
        placeholder="Ej: Acción Ordinaria"
        class="input input-bordered w-full focus:input-primary" 
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Valor por Unidad *</span>
        </label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50">$</span>
          <input 
            v-model.number="formData.value" 
            type="number" 
            required 
            min="0"
            step="0.01"
            class="input input-bordered w-full pl-8 focus:input-primary" 
          />
        </div>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Aporte Mensual *</span>
        </label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50">$</span>
          <input 
            v-model.number="formData.monthly_contribution" 
            type="number" 
            required 
            min="0"
            step="0.01"
            class="input input-bordered w-full pl-8 focus:input-primary" 
          />
        </div>
      </div>
    </div>

    <div class="form-control bg-base-200 p-4 rounded-lg mt-2">
      <label class="label cursor-pointer justify-start gap-4">
        <input 
          v-model="formData.is_guaranteed" 
          type="checkbox" 
          class="checkbox checkbox-primary" 
        />
        <span class="label-text font-medium text-base">¿Es de rendimiento garantizado?</span>
      </label>
      
      <div v-if="formData.is_guaranteed" class="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
        <label class="label">
          <span class="label-text font-medium text-primary">Tasa de Rendimiento Garantizada (%)</span>
        </label>
        <div class="relative">
          <input 
            v-model.number="formData.guaranteed_yield" 
            type="number" 
            placeholder="0.05"
            min="0"
            max="1"
            step="0.001"
            required
            class="input input-bordered w-full focus:input-primary" 
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50">decimal</span>
        </div>
        <p class="text-xs text-base-content/60 mt-1">Multiplica por 100 para obtener el porcentaje (ej: 0.05 = 5%)</p>
      </div>
    </div>

    <div class="flex justify-end gap-3 mt-6">
      <button 
        type="button" 
        @click="$emit('cancel')" 
        class="btn btn-ghost"
      >
        Cancelar
      </button>
      <button 
        type="submit" 
        class="btn btn-primary"
      >
        Guardar Acción
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CreateStockRequest } from '@/api/stocks.api'

const props = defineProps<{
  initialData?: Partial<CreateStockRequest>
}>()

const emit = defineEmits<{
  submit: [data: CreateStockRequest]
  cancel: []
}>()

const formData = ref<CreateStockRequest>({
  name: props.initialData?.name || '',
  value: props.initialData?.value || 0,
  monthly_contribution: props.initialData?.monthly_contribution || 0,
  is_guaranteed: props.initialData?.is_guaranteed || false,
  guaranteed_yield: props.initialData?.guaranteed_yield || null
})

// Resetear rendimiento si se desmarca
watch(() => formData.value.is_guaranteed, (isGuaranteed) => {
  if (!isGuaranteed) {
    formData.value.guaranteed_yield = null
  } else if (formData.value.guaranteed_yield === null) {
    formData.value.guaranteed_yield = 0.05
  }
})

function handleSubmit() {
  emit('submit', { ...formData.value })
}
</script>
