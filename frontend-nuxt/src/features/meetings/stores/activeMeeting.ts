import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { meetingsApi, type Meeting, type MeetingSummary } from '@/api/meetings.api'
import { ApiException } from '@/api/types'

export const useActiveMeetingStore = defineStore('activeMeeting', () => {
  // State - Datos mock iniciales
  const meeting = ref<Meeting | null>(null)
  const currentStep = ref<number>(1)
  const summary = ref<MeetingSummary | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Estado local para simular operaciones (sin persistencia)
  const payments = ref<any[]>([])  // Pagos registrados localmente
  const purchases = ref<any[]>([])  // Compras registradas localmente
  const stockOperations = ref<any[]>([])  // Operaciones de acciones
  const revaluationExecuted = ref(false)  // Si la revalorización fue ejecutada

  // Getters
  const meetingId = computed(() => meeting.value?.id || null)
  const isActive = computed(() => meeting.value?.status === 'active')
  
  // Actions - Usar mockApi
  async function fetchActiveMeeting() {
    loading.value = true
    error.value = null
    try {
      // El mockApi ya está configurado para retornar datos mock
      meeting.value = await meetingsApi.getActiveMeeting()
      if (meeting.value?.summary) {
        summary.value = meeting.value.summary
      }
    } catch (e) {
      // Si no hay reunión activa (404), es un estado válido del sistema
      // No establecemos error para este caso, solo limpiamos el estado
      if (e instanceof ApiException && e.status === 404) {
        meeting.value = null
        summary.value = null
        error.value = null
      } else {
        // Para otros errores, sí establecemos el error
        error.value = e instanceof Error ? e.message : 'Error al cargar reunión'
        meeting.value = null
        summary.value = null
      }
    } finally {
      loading.value = false
    }
  }
  
  async function fetchSummary() {
    // Usar datos mock del meeting para summary
    if (meeting.value?.summary) {
      summary.value = meeting.value.summary
    } else if (meeting.value) {
      // Si no hay summary, crear uno básico desde el mock
      await fetchActiveMeeting()
    }
  }

  async function refreshActiveMeeting() {
    // Refrescar la reunión activa desde el backend para obtener datos actualizados
    await fetchActiveMeeting()
  }
  
  function goToStep(step: number) {
    if (step >= 1 && step <= 5) {
      currentStep.value = step
    }
  }
  
  function nextStep() {
    if (currentStep.value < 5) {
      currentStep.value++
    }
  }
  
  function previousStep() {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  // Funciones para manejar estado local
  function addPayment(payment: any) {
    payments.value.push(payment)
    // Actualizar summary local si es necesario
    updateSummaryFromLocalState()
  }

  function addPurchase(purchase: any) {
    purchases.value.push(purchase)
  }

  function addStockOperation(operation: any) {
    stockOperations.value.push(operation)
  }

  function setRevaluationExecuted(executed: boolean) {
    revaluationExecuted.value = executed
  }

  function updateSummaryFromLocalState() {
    // Calcular total_collected desde pagos locales
    const totalCollected = payments.value.reduce((sum, p) => sum + (p.total_amount || 0), 0)
    if (summary.value) {
      summary.value.total_collected = totalCollected
    }
  }

  function reset() {
    meeting.value = null
    currentStep.value = 1
    summary.value = null
    payments.value = []
    purchases.value = []
    stockOperations.value = []
    revaluationExecuted.value = false
    error.value = null
  }

  return {
    // State
    meeting,
    currentStep,
    summary,
    loading,
    error,
    payments,
    purchases,
    stockOperations,
    revaluationExecuted,
    // Getters
    meetingId,
    isActive,
    // Actions
    fetchActiveMeeting,
    fetchSummary,
    refreshActiveMeeting,
    goToStep,
    nextStep,
    previousStep,
    addPayment,
    addPurchase,
    addStockOperation,
    setRevaluationExecuted,
    updateSummaryFromLocalState,
    reset
  }
})

