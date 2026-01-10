import { ref, computed } from 'vue'
import { operationsApi, type Operation } from '@/api/operations.api'
import { meetingsApi, type Meeting, type RevaluationResponse } from '@/api/meetings.api'
import { stocksApi } from '@/api/stocks.api'

export interface MeetingSummaryData {
  totalCollected: number
  totalDisbursed: number
  shareValue: number
  participants: number
  collections: {
    memberContributions: { count: number; amount: number }
    loanPayments: { count: number; amount: number }
    interestCollected: number
    feesCollected: number
  }
  disbursements: {
    newLoans: { count: number; amount: number }
    stockLiquidations: { count: number; amount: number }
    dividendPayments: { count: number; amount: number }
  }
  metrics: {
    attendance: { current: number; percentage: number }
    revaluation: { previousValue: number; newValue: number; percentage: number } | null
    paymentsUpToDate: number
    overduePayments: number
  }
  memberOperations: Map<string, Operation[]>
}

const CASH_ACCOUNT = 'CASH'
const INTEREST_INCOME_ACCOUNT = 'INTEREST_INCOME'
const FEE_INCOME_ACCOUNT = 'FEE_INCOME'

export function useMeetingSummary() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const operations = ref<Operation[]>([])
  const allMeetings = ref<Meeting[]>([])
  const meetingNumber = ref<number>(0)
  const revaluationData = ref<RevaluationResponse | null>(null)

  const shareValueRef = ref<number>(0)

  const summary = computed<MeetingSummaryData>(() => {
    if (operations.value.length === 0) {
      return getEmptySummary()
    }

    // Helper para sumar entries por account_type
    const sumByAccountType = (
      accountType: string,
      positiveOnly = false
    ): number => {
      let total = 0
      operations.value.forEach((op) => {
        op.entries?.forEach((entry) => {
          if (entry.account_type === accountType) {
            if (positiveOnly && entry.amount > 0) {
              total += entry.amount
            } else if (!positiveOnly) {
              total += entry.amount
            }
          }
        })
      })
      return total
    }

    // Helper para contar y sumar por tipo de operación
    const countAndSumByOperationType = (
      operationType: string,
      cashPositive: boolean
    ): { count: number; amount: number } => {
      const matchingOps = operations.value.filter(
        (op) => op.type === operationType
      )
      let total = 0
      matchingOps.forEach((op) => {
        op.entries?.forEach((entry) => {
          if (entry.account_type === CASH_ACCOUNT) {
            if (cashPositive && entry.amount > 0) {
              total += entry.amount
            } else if (!cashPositive && entry.amount < 0) {
              total += Math.abs(entry.amount)
            }
          }
        })
      })
      return { count: matchingOps.length, amount: total }
    }

    // Total Recaudado: Suma de CASH con amount > 0
    const totalCollected = sumByAccountType(CASH_ACCOUNT, true)

    // Total Desembolsado: Sumar todos los valores negativos de CASH (abs)
    let totalDisbursedCalc = 0
    operations.value.forEach((op) => {
      op.entries?.forEach((entry) => {
        if (entry.account_type === CASH_ACCOUNT && entry.amount < 0) {
          totalDisbursedCalc += Math.abs(entry.amount)
        }
      })
    })

    // Participantes: COUNT DISTINCT de member_id
    const uniqueMembers = new Set<string>()
    operations.value.forEach((op) => {
      if (op.member_id) {
        uniqueMembers.add(op.member_id)
      }
    })
    const participants = uniqueMembers.size

    // Valor Acción: Usar el valor cargado desde stocks o revaluación
    // Se actualizará cuando se llame a loadShareValue()
    let shareValue = shareValueRef.value
    
    // Si aún no hay valor, intentar obtenerlo desde stocks (sincrónico)
    if (shareValue === 0) {
      // Esto se actualizará asíncronamente cuando se cargue
    }

    // Recaudos por tipo
    const memberContributions = countAndSumByOperationType(
      'MONTHLY_PAYMENT',
      true
    )
    const loanPayments = countAndSumByOperationType('LOAN_PAYMENT', true)
    
    // Intereses cobrados: Sumar INTEREST_INCOME (usar ABS)
    let interestCollected = 0
    operations.value.forEach((op) => {
      op.entries?.forEach((entry) => {
        if (entry.account_type === INTEREST_INCOME_ACCOUNT) {
          interestCollected += Math.abs(entry.amount)
        }
      })
    })

    // Moras recaudadas: Sumar FEE_INCOME (usar ABS)
    let feesCollected = 0
    operations.value.forEach((op) => {
      op.entries?.forEach((entry) => {
        if (entry.account_type === FEE_INCOME_ACCOUNT) {
          feesCollected += Math.abs(entry.amount)
        }
      })
    })

    // Desembolsos por tipo
    const newLoans = countAndSumByOperationType('LOAN_DISBURSEMENT', false)
    const stockLiquidations = countAndSumByOperationType(
      'STOCK_WITHDRAWAL',
      false
    )
    const dividendPayments = countAndSumByOperationType(
      'DIVIDEND_PAYMENT',
      false
    )

    // Revalorización: Usar datos del endpoint de revaluación
    let revaluation = null
    if (revaluationData.value && revaluationData.value.details.length > 0) {
      // Calcular promedio de valores anteriores y nuevos desde los details
      // Similar a como lo hace el backend en meeting-summary.service.ts
      const details = revaluationData.value.details
      const avgPrevious =
        details.reduce((sum, d) => sum + d.previous_value, 0) / details.length
      const avgNew =
        details.reduce((sum, d) => sum + d.new_value, 0) / details.length
      const percentage =
        avgPrevious > 0 ? ((avgNew - avgPrevious) / avgPrevious) * 100 : 0

      revaluation = {
        previousValue: avgPrevious,
        newValue: avgNew,
        percentage,
      }
    }

    // Agrupar operaciones por miembro
    const memberOperationsMap = new Map<string, Operation[]>()
    operations.value.forEach((op) => {
      if (op.member_id) {
        const existing = memberOperationsMap.get(op.member_id) || []
        existing.push(op)
        memberOperationsMap.set(op.member_id, existing)
      }
    })

    return {
      totalCollected,
      totalDisbursed: totalDisbursedCalc,
      shareValue,
      participants,
      collections: {
        memberContributions,
        loanPayments,
        interestCollected,
        feesCollected,
      },
      disbursements: {
        newLoans,
        stockLiquidations,
        dividendPayments,
      },
      metrics: {
        attendance: {
          current: participants,
          percentage: 0, // Se calculará si hay total esperado
        },
        revaluation,
        paymentsUpToDate: 0, // Placeholder - requiere lógica de negocio
        overduePayments: 0, // Placeholder - requiere lógica de negocio
      },
      memberOperations: memberOperationsMap,
    }
  })

  function getEmptySummary(): MeetingSummaryData {
    return {
      totalCollected: 0,
      totalDisbursed: 0,
      shareValue: 0,
      participants: 0,
      collections: {
        memberContributions: { count: 0, amount: 0 },
        loanPayments: { count: 0, amount: 0 },
        interestCollected: 0,
        feesCollected: 0,
      },
      disbursements: {
        newLoans: { count: 0, amount: 0 },
        stockLiquidations: { count: 0, amount: 0 },
        dividendPayments: { count: 0, amount: 0 },
      },
      metrics: {
        attendance: { current: 0, percentage: 0 },
        revaluation: null,
        paymentsUpToDate: 0,
        overduePayments: 0,
      },
      memberOperations: new Map(),
    }
  }

  async function loadSummary(meetingId: string) {
    loading.value = true
    error.value = null
    try {
      // Obtener todas las operaciones de la reunión
      // El endpoint /v2/accounting/operations ya debería incluir entries según la estructura
      const operationsResponse = await operationsApi.getOperations({
        meeting_id: meetingId,
        limit: 1000, // Obtener todas las operaciones
        order_by: 'ASC',
      })
      
      // Verificar si las operaciones tienen entries, si no, obtenerlas individualmente
      let opsWithEntries = operationsResponse.data
      const needsEntries = opsWithEntries.some(op => !op.entries || op.entries.length === 0)
      
      if (needsEntries && opsWithEntries.length > 0) {
        // Si algunas operaciones no tienen entries, obtenerlas individualmente
        opsWithEntries = await Promise.all(
          opsWithEntries.map(async (op) => {
            if (!op.entries || op.entries.length === 0) {
              try {
                const fullOp = await operationsApi.getOperationById(op.id)
                return fullOp
              } catch {
                return op
              }
            }
            return op
          })
        )
      }
      
      operations.value = opsWithEntries

      // Obtener lista de reuniones para calcular número
      const meetings = await meetingsApi.getMeetings()
      allMeetings.value = meetings
      const sortedMeetings = [...meetings].sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      const index = sortedMeetings.findIndex((m) => m.id === meetingId)
      meetingNumber.value = index >= 0 ? index + 1 : 0

      // Cargar datos de revaluación desde el endpoint específico
      try {
        revaluationData.value = await meetingsApi.getRevaluationPreview(meetingId)
      } catch (e) {
        // Si no hay revaluación o hay error, dejar null
        console.warn('No se pudo cargar la revaluación:', e)
        revaluationData.value = null
      }

      // Cargar valor de acción después de obtener las operaciones
      // para poder verificar si hay revaluación primero
      const shareValueCalculated = await loadShareValue()
      shareValueRef.value = shareValueCalculated
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : 'Error al cargar resumen de reunión'
      console.error('Error loading meeting summary:', e)
    } finally {
      loading.value = false
    }
  }

  async function loadShareValue(): Promise<number> {
    try {
      // Nota: El valor exacto debería venir del backend en una respuesta de summary detallado
      // Por ahora usamos un aproximado desde los stocks actuales
      const stocks = await stocksApi.getStocks()
      if (stocks.length > 0) {
        const totalValue = stocks.reduce((sum, s) => sum + s.value, 0)
        return totalValue / stocks.length
      }
    } catch (e) {
      console.warn('No se pudo cargar el valor de las acciones:', e)
    }
    return 0
  }

  return {
    loading,
    error,
    summary,
    operations,
    meetingNumber,
    loadSummary,
  }
}

