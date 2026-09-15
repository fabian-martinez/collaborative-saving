<!--
  Copyright 2026 Collaborative Saving Project.
  All rights reserved.
-->
<template>
  <div class="stock-detail-view container mx-auto p-4 md:p-6 max-w-5xl space-y-6">
    <!-- Action / Navigation Bar -->
    <div class="flex items-center gap-4">
      <button aria-label="Volver" @click="router.back()" class="btn btn-circle btn-ghost">
        <ArrowLeft class="w-6 h-6" />
      </button>
      <h1 class="text-2xl font-bold text-base-content m-0 flex-1">Detalle de Acción</h1>
      <button
        v-if="stock"
        @click="showEditModal = true"
        class="btn btn-primary btn-sm"
        data-testid="edit-stock-detail-btn"
      >
        <EditPencil class="w-4 h-4 mr-1" />
        Editar Acción
      </button>
    </div>

    <LoadingSpinner :loading="loading" message="Cargando detalle de la acción..." />
    <ErrorMessage v-if="error && !loading" :error="error" />

    <div v-if="stock && !loading && !error" class="card bg-base-100 shadow-sm border border-base-200">
      <div class="card-body">
        <!-- Title & Badges -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-base-200 pb-4 mb-4">
          <div>
            <h2 class="card-title text-xl font-bold text-base-content mb-1">
              {{ stock.name || stock.type }}
            </h2>
            <p class="text-xs text-base-content/60 font-mono">ID: {{ stock.id }}</p>
          </div>
          <div class="mt-2 md:mt-0 flex gap-2">
            <span
              :class="[
                'badge badge-md font-medium',
                stock.behavior === 'DIVIDEND_YIELD' ? 'badge-secondary' : 'badge-ghost'
              ]"
            >
              {{ stock.behavior === 'DIVIDEND_YIELD' ? 'Rendimiento / Dividendos' : 'Apreciación de Capital' }}
            </span>
            <span
              v-if="stock.is_guaranteed"
              class="badge badge-success badge-md font-medium"
            >
              Garantizada
            </span>
            <span v-else class="badge badge-outline badge-md text-base-content/60">
              Variable
            </span>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Nombre</p>
              <p class="text-base font-medium text-base-content">{{ stock.name || stock.type }}</p>
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Tipo de Acción Asociado</p>
              <p v-if="stockTypeName" class="text-base font-medium text-base-content">
                {{ stockTypeName }}
              </p>
              <p v-else class="text-sm text-base-content/50 italic">Ningún tipo asociado</p>
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Comportamiento Financiero</p>
              <p class="text-base font-medium text-base-content">
                {{ stock.behavior === 'DIVIDEND_YIELD' ? 'Rendimiento / Pago de Dividendos' : 'Apreciación de Capital' }}
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Valor por Acción</p>
              <p class="text-xl font-bold text-primary">{{ formatCurrency(stock.value) }}</p>
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Aporte Mensual</p>
              <p class="text-lg font-semibold text-base-content">{{ formatCurrency(stock.monthly_contribution) }}</p>
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Rendimiento Garantizado</p>
              <p v-if="stock.is_guaranteed && stock.guaranteed_yield !== null && stock.guaranteed_yield !== undefined" class="text-base font-medium text-success">
                {{ (stock.guaranteed_yield * 100).toFixed(2) }}% mensual
              </p>
              <p v-else class="text-sm text-base-content/50">No aplica (variable)</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <StockForm
      :show="showEditModal"
      :stock="stock"
      @close="showEditModal = false"
      @saved="handleStockSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, EditPencil } from 'iconoir-vue/regular'
import { stocksApi, type Stock } from '@/api/stocks.api'
import { settingsApi, type StockType } from '@/api/settings.api'
import { formatCurrency } from '@/shared/utils/formatters'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import StockForm from '../components/StockForm.vue'

const route = useRoute()
const router = useRouter()

const stock = ref<Stock | null>(null)
const stockTypes = ref<StockType[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showEditModal = ref(false)

const stockTypeName = computed(() => {
  if (stock.value?.stock_type?.name) {
    return stock.value.stock_type.name
  }
  if (stock.value?.stock_type_id && stockTypes.value.length > 0) {
    const found = stockTypes.value.find(st => st.id === stock.value?.stock_type_id)
    if (found) return found.name
  }
  return null
})

async function loadData() {
  loading.value = true
  error.value = null
  try {
    const [fetchedStock, types] = await Promise.all([
      stocksApi.getStockById(route.params.id as string),
      settingsApi.getStockTypes().catch(() => [])
    ])
    stock.value = fetchedStock
    stockTypes.value = types
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar acción'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

function handleStockSaved(updatedStock: Stock) {
  stock.value = updatedStock
  showEditModal.value = false
}
</script>
