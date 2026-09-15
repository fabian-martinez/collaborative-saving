<!--
  Copyright 2026 Collaborative Saving Project.
  All rights reserved.
-->
<template>
  <Modal :show="show" :title="isEditing ? 'Editar Acción' : 'Nueva Acción'" @close="handleClose">
    <form data-testid="stock-form" @submit.prevent="handleSubmit" class="space-y-4">
      <div v-if="formError" class="alert alert-error text-sm py-2" data-testid="stock-form-error">
        <span>{{ formError }}</span>
      </div>

      <!-- Nombre -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Nombre <span class="text-error">*</span></span>
        </label>
        <input
          v-model.trim="formData.name"
          type="text"
          placeholder="ej. Acción Ordinaria"
          required
          class="input input-bordered w-full"
          data-testid="stock-name-input"
        />
      </div>

      <!-- Tipo de Acción (StockType) -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Tipo de Acción Asociado</span>
          <span v-if="loadingTypes" class="loading loading-spinner loading-xs"></span>
        </label>
        <select
          v-model="formData.stock_type_id"
          @change="onStockTypeChange"
          class="select select-bordered w-full"
          data-testid="stock-type-select"
        >
          <option :value="null">-- Seleccionar Tipo de Acción (Opcional) --</option>
          <option
            v-for="st in stockTypes"
            :key="st.id"
            :value="st.id"
          >
            {{ st.name }} ({{ st.code }})
          </option>
        </select>
        <label class="label">
          <span class="label-text-alt text-base-content/60">
            Al seleccionar un tipo, se autocompletarán los valores financieros por defecto.
          </span>
        </label>
      </div>

      <!-- Valor por Acción y Aporte Mensual -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Valor por Acción ($) <span class="text-error">*</span></span>
          </label>
          <input
            v-model.number="formData.value"
            type="number"
            min="1"
            step="1"
            placeholder="ej. 100000"
            required
            class="input input-bordered w-full"
            data-testid="stock-value-input"
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Aporte Mensual ($) <span class="text-error">*</span></span>
          </label>
          <input
            v-model.number="formData.monthly_contribution"
            type="number"
            min="1"
            step="1"
            placeholder="ej. 50000"
            required
            class="input input-bordered w-full"
            data-testid="stock-monthly-contribution-input"
          />
        </div>
      </div>

      <!-- Comportamiento Financiero -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Comportamiento Financiero <span class="text-error">*</span></span>
        </label>
        <select
          v-model="formData.behavior"
          class="select select-bordered w-full"
          data-testid="stock-behavior-select"
        >
          <option value="CAPITAL_APPRECIATION">Apreciación de Capital</option>
          <option value="DIVIDEND_YIELD">Rendimiento / Dividendos</option>
        </select>
      </div>

      <!-- Toggle Garantizada -->
      <div class="form-control bg-base-200/50 p-3 rounded-lg border border-base-200">
        <label class="cursor-pointer label">
          <div>
            <span class="label-text font-medium">Rendimiento Garantizado</span>
            <p class="text-xs text-base-content/60">Indica si esta acción tiene una tasa de rentabilidad fija pactada.</p>
          </div>
          <input
            type="checkbox"
            v-model="formData.is_guaranteed"
            class="checkbox checkbox-primary"
            data-testid="stock-guaranteed-checkbox"
          />
        </label>
      </div>

      <!-- Rendimiento Garantizado (%) -->
      <div v-if="formData.is_guaranteed" class="form-control">
        <label class="label">
          <span class="label-text font-medium">Rendimiento Mensual Garantizado (%) <span class="text-error">*</span></span>
        </label>
        <div class="relative">
          <input
            v-model.number="formData.yieldPercent"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="ej. 2.0"
            required
            class="input input-bordered w-full pr-8"
            data-testid="stock-yield-input"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 font-semibold text-gray-500">%</span>
        </div>
      </div>

      <!-- Acciones del Modal -->
      <div class="modal-action">
        <button
          type="button"
          @click="handleClose"
          class="btn btn-ghost"
          data-testid="cancel-stock-btn"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="submitting"
          data-testid="submit-stock-btn"
        >
          <span v-if="submitting" class="loading loading-spinner loading-sm mr-1"></span>
          {{ isEditing ? 'Guardar Cambios' : 'Crear Acción' }}
        </button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '@/shared/components/Modal.vue'
import { settingsApi, type StockType } from '@/api/settings.api'
import { type Stock } from '@/api/stocks.api'
import { useStocksStore } from '../stores/stocks'

const props = defineProps<{
  show: boolean
  stock?: Stock | null
}>()

const emit = defineEmits<{
  close: []
  saved: [stock: Stock]
}>()

const stocksStore = useStocksStore()

const isEditing = computed(() => Boolean(props.stock?.id))
const stockTypes = ref<StockType[]>([])
const loadingTypes = ref(false)
const submitting = ref(false)
const formError = ref<string | null>(null)

interface FormState {
  name: string
  stock_type_id: string | null
  value: number
  monthly_contribution: number
  behavior: string
  is_guaranteed: boolean
  yieldPercent: number | null
}

const defaultForm: FormState = {
  name: '',
  stock_type_id: null,
  value: 0,
  monthly_contribution: 0,
  behavior: 'CAPITAL_APPRECIATION',
  is_guaranteed: false,
  yieldPercent: null
}

const formData = ref<FormState>({ ...defaultForm })

async function loadStockTypes() {
  if (stockTypes.value.length > 0) return
  loadingTypes.value = true
  try {
    stockTypes.value = await settingsApi.getStockTypes()
  } catch {
    // Si falla cargar los tipos, no bloqueamos el formulario
  } finally {
    loadingTypes.value = false
  }
}

function initForm() {
  formError.value = null
  if (props.stock) {
    const yieldPct =
      props.stock.guaranteed_yield !== null && props.stock.guaranteed_yield !== undefined
        ? Number((props.stock.guaranteed_yield * 100).toFixed(4))
        : null

    formData.value = {
      name: props.stock.name || props.stock.type || '',
      stock_type_id: props.stock.stock_type_id || null,
      value: props.stock.value || 0,
      monthly_contribution: props.stock.monthly_contribution || 0,
      behavior: props.stock.behavior || 'CAPITAL_APPRECIATION',
      is_guaranteed: Boolean(props.stock.is_guaranteed),
      yieldPercent: yieldPct
    }
  } else {
    formData.value = { ...defaultForm }
  }
}

watch(
  () => props.show,
  (val) => {
    if (val) {
      initForm()
      loadStockTypes()
    }
  },
  { immediate: true }
)

function onStockTypeChange() {
  if (!formData.value.stock_type_id) return
  const selected = stockTypes.value.find(st => st.id === formData.value.stock_type_id)
  if (selected) {
    formData.value.behavior = selected.behavior
    formData.value.is_guaranteed = selected.is_guaranteed
    formData.value.yieldPercent =
      selected.guaranteed_yield !== null && selected.guaranteed_yield !== undefined
        ? Number((selected.guaranteed_yield * 100).toFixed(4))
        : null

    // Si el nombre aún está vacío, sugerir el nombre del tipo
    if (!formData.value.name.trim()) {
      formData.value.name = selected.name
    }
  }
}

function handleClose() {
  formError.value = null
  emit('close')
}

async function handleSubmit() {
  formError.value = null

  if (!formData.value.name.trim()) {
    formError.value = 'El nombre de la acción es obligatorio'
    return
  }

  if (formData.value.value <= 0) {
    formError.value = 'El valor por acción debe ser mayor a 0'
    return
  }

  if (formData.value.monthly_contribution <= 0) {
    formError.value = 'El aporte mensual debe ser mayor a 0'
    return
  }

  if (formData.value.is_guaranteed) {
    if (formData.value.yieldPercent === null || formData.value.yieldPercent < 0) {
      formError.value = 'El rendimiento garantizado debe ser mayor o igual a 0%'
      return
    }
  }

  const guaranteedYield =
    formData.value.is_guaranteed && formData.value.yieldPercent !== null
      ? formData.value.yieldPercent / 100
      : null

  submitting.value = true
  try {
    let savedStock: Stock
    if (isEditing.value && props.stock?.id) {
      savedStock = await stocksStore.updateStock(props.stock.id, {
        name: formData.value.name.trim(),
        stock_type_id: formData.value.stock_type_id,
        value: formData.value.value,
        monthly_contribution: formData.value.monthly_contribution,
        behavior: formData.value.behavior,
        is_guaranteed: formData.value.is_guaranteed,
        guaranteed_yield: guaranteedYield
      })
    } else {
      savedStock = await stocksStore.createStock({
        name: formData.value.name.trim(),
        stock_type_id: formData.value.stock_type_id,
        value: formData.value.value,
        monthly_contribution: formData.value.monthly_contribution,
        behavior: formData.value.behavior,
        is_guaranteed: formData.value.is_guaranteed,
        guaranteed_yield: guaranteedYield
      })
    }
    emit('saved', savedStock)
    handleClose()
  } catch (err: unknown) {
    formError.value = err instanceof Error ? err.message : 'Error al guardar la acción'
  } finally {
    submitting.value = false
  }
}
</script>
