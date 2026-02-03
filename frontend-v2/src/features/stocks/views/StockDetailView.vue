<template>
  <div class="stock-detail-view">
    <h1>Detalle de Acción</h1>
    <LoadingSpinner :loading="loading" />
    <ErrorMessage :error="error" />
    <div v-if="stock">
      <p>Nombre: {{ stock.name }}</p>
      <p>Valor: {{ formatCurrency(stock.value) }}</p>
      <p>Aporte Mensual: {{ formatCurrency(stock.monthly_contribution) }}</p>
      <p>Garantizada: {{ stock.is_guaranteed ? 'Sí' : 'No' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { stocksApi, type Stock } from '@/api/stocks.api'
import { formatCurrency } from '@/shared/utils/formatters'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'

const route = useRoute()
const stock = ref<Stock | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    stock.value = await stocksApi.getStockById(route.params.id as string)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar acción'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.stock-detail-view {
  padding: 2rem;
}
</style>

