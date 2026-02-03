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

    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium">Tipo de Activo *</span>
      </label>
      <select 
        v-model="formData.stockTypeId" 
        required 
        class="select select-bordered w-full focus:select-primary"
      >
        <option value="" disabled>Seleccione un tipo de activo</option>
        <option v-for="type in stockTypes" :key="type.id" :value="type.id">
          {{ type.name }} ({{ type.isGuaranteed ? 'Garantizado' : 'Variable' }})
        </option>
      </select>
      <p v-if="selectedType" class="text-xs text-base-content/60 mt-1">
        Comportamiento: {{ selectedType.behavior === 'CAPITAL_APPRECIATION' ? 'Solo Valorización' : 'Dividendos' }}
        <span v-if="selectedType.isGuaranteed && selectedType.guaranteedYield !== null"> 
          - Tasa: {{ (selectedType.guaranteedYield * 100).toFixed(1) }}%
        </span>
      </p>
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

    <div v-if="selectedType" class="alert alert-info py-2 px-4 text-sm mt-2">
      <div class="flex items-center gap-2">
        <InfoCircle class="w-4 h-4" />
        <span>El rendimiento será <strong>{{ selectedType.isGuaranteed ? 'Garantizado' : 'Variable' }}</strong> según el tipo de activo.</span>
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
import { ref, onMounted, computed } from 'vue'
import type { CreateStockRequest, Stock } from '@/api/stocks.api'
import { settingsApi, type StockType } from '@/api/settings.api'
import { InfoCircle } from 'iconoir-vue/regular'

const props = defineProps<{
  initialData?: Partial<Stock>
}>()

const emit = defineEmits<{
  submit: [data: CreateStockRequest]
  cancel: []
}>()

const formData = ref<CreateStockRequest>({
  name: props.initialData?.name || '',
  value: props.initialData?.value || 0,
  monthly_contribution: props.initialData?.monthly_contribution || 0,
  stockTypeId: (props.initialData as any)?.stockTypeId || ''
})

const stockTypes = ref<StockType[]>([])
const loadingTypes = ref(false)

const selectedType = computed(() => 
  stockTypes.value.find(t => t.id === formData.value.stockTypeId)
)

onMounted(async () => {
  loadingTypes.value = true
  try {
    stockTypes.value = await settingsApi.getStockTypes()
  } catch (e) {
    console.error('Error loading stock types', e)
  } finally {
    loadingTypes.value = false
  }
})

function handleSubmit() {
  emit('submit', { ...formData.value })
}
</script>
