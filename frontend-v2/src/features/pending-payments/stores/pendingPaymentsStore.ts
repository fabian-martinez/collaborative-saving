import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { pendingPaymentsApi, type PendingPayment, type GetPendingPaymentsParams, type UpdatePendingPaymentData } from '@/api/pending-payments.api'
import { useToast } from '@/shared/composables/useToast'
import { ApiException } from '@/api/types'

export const usePendingPaymentsStore = defineStore('pendingPayments', () => {
  const { error: showError, success: showSuccess } = useToast()

  // State
  const payments = ref<PendingPayment[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const getPendingPaymentsData = computed(() => payments.value)
  const getPaymentById = computed(() => (id: string) => payments.value.find(p => p.id === id))

  // Actions
  const fetchPayments = async (params?: GetPendingPaymentsParams) => {
    isLoading.value = true
    error.value = null
    try {
      payments.value = await pendingPaymentsApi.getPendingPayments(params)
    } catch (err) {
      if (err instanceof ApiException) {
        error.value = err.message
        showError(err.message)
      } else {
        error.value = 'Error al cargar los pagos pendientes'
        showError(error.value)
      }
    } finally {
      isLoading.value = false
    }
  }

  const updatePayment = async (id: string, data: UpdatePendingPaymentData) => {
    isLoading.value = true
    error.value = null
    try {
      await pendingPaymentsApi.updatePendingPayment(id, data)
      // Actualización optimista o recarga
      const index = payments.value.findIndex(p => p.id === id)
      if (index !== -1) {
        payments.value[index] = { ...payments.value[index], ...data }
      }
      showSuccess('Pago pendiente actualizado')
    } catch (err) {
      if (err instanceof ApiException) {
        error.value = err.message
        showError(err.message)
      } else {
        error.value = 'Error al actualizar el pago pendiente'
        showError(error.value)
      }
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deletePayment = async (id: string) => {
    isLoading.value = true
    error.value = null
    try {
      await pendingPaymentsApi.deletePendingPayment(id)
      payments.value = payments.value.filter(p => p.id !== id)
      showSuccess('Pago pendiente eliminado')
    } catch (err) {
      if (err instanceof ApiException) {
        error.value = err.message
        showError(err.message)
      } else {
        error.value = 'Error al eliminar el pago pendiente'
        showError(error.value)
      }
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    payments,
    isLoading,
    error,
    getPendingPaymentsData,
    getPaymentById,
    fetchPayments,
    updatePayment,
    deletePayment
  }
})
