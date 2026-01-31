import { defineStore } from 'pinia'
import { ref } from 'vue'
import { stocksApi, type Stock, type CreateStockRequest, type UpdateStockRequest } from '@/api/stocks.api'

export const useStocksStore = defineStore('stocks', () => {
  const stocks = ref<Stock[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchStocks() {
    loading.value = true
    error.value = null
    try {
      stocks.value = await stocksApi.getStocks()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar acciones'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createStock(data: CreateStockRequest) {
    loading.value = true
    error.value = null
    try {
      const newStock = await stocksApi.createStock(data)
      stocks.value.push(newStock)
      return newStock
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al crear acción'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateStock(id: string, data: UpdateStockRequest) {
    loading.value = true
    error.value = null
    try {
      const updatedStock = await stocksApi.updateStock(id, data)
      const index = stocks.value.findIndex(s => s.id === id)
      if (index !== -1) {
        stocks.value[index] = updatedStock
      }
      return updatedStock
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al actualizar acción'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteStock(id: string) {
    loading.value = true
    error.value = null
    try {
      await stocksApi.deleteStock(id)
      stocks.value = stocks.value.filter(s => s.id !== id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al eliminar acción'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    stocks,
    loading,
    error,
    fetchStocks,
    createStock,
    updateStock,
    deleteStock
  }
})
