/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  stocksApi,
  type Stock,
  type CreateStockRequest,
  type UpdateStockRequest
} from '@/api/stocks.api'

export const useStocksStore = defineStore('stocks', () => {
  const stocks = ref<Stock[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchStocks() {
    loading.value = true
    error.value = null
    try {
      stocks.value = await stocksApi.getStocks()
      return stocks.value
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar acciones'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function getStockById(id: string): Promise<Stock> {
    const existing = stocks.value.find(s => s.id === id)
    if (existing) {
      return existing
    }
    loading.value = true
    error.value = null
    try {
      const stock = await stocksApi.getStockById(id)
      const index = stocks.value.findIndex(s => s.id === id)
      if (index !== -1) {
        stocks.value[index] = stock
      } else {
        stocks.value.push(stock)
      }
      return stock
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al obtener detalle de acción'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createStock(data: CreateStockRequest): Promise<Stock> {
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

  async function updateStock(id: string, data: UpdateStockRequest): Promise<Stock> {
    loading.value = true
    error.value = null
    try {
      const updated = await stocksApi.updateStock(id, data)
      const index = stocks.value.findIndex(s => s.id === id)
      if (index !== -1) {
        stocks.value[index] = updated
      }
      return updated
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al actualizar acción'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteStock(id: string): Promise<void> {
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
    getStockById,
    createStock,
    updateStock,
    deleteStock
  }
})
