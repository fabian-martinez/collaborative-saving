import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  membersApi,
  type Member,
  type MemberDue,
  type MemberPayment,
  type MemberPurchase,
  type Loan,
  type StockSubscription,
  type StockExchangeResponse,
  type StockTransferResponse,
  type StockLoanPaymentResponse,
  type PaymentSchedule,
  type GetMemberStockModificationsQuery,
  type GetPaymentScheduleQuery
} from '@/api/members.api'

export const useMemberDetailStore = defineStore('memberDetail', () => {
  const member = ref<Member | null>(null)
  const dues = ref<MemberDue[]>([])
  const payments = ref<MemberPayment[]>([])
  const purchases = ref<MemberPurchase[]>([])
  const loans = ref<Loan[]>([])
  const stockSubscriptions = ref<StockSubscription[]>([])
  const exchanges = ref<StockExchangeResponse[]>([])
  const transfers = ref<StockTransferResponse[]>([])
  const stockLoanPayments = ref<StockLoanPaymentResponse[]>([])
  const paymentSchedule = ref<PaymentSchedule | null>(null)
  const insurance = ref<{ insurance_amount: number } | null>(null)
  
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Loading states individuales
  const loadingLoans = ref(false)
  const loadingSubscriptions = ref(false)
  const loadingExchanges = ref(false)
  const loadingTransfers = ref(false)
  const loadingStockLoanPayments = ref(false)
  const loadingPaymentSchedule = ref(false)
  const loadingInsurance = ref(false)
  
  // Cálculos derivados
  // Total en acciones se calcula sumando el total_value de las purchases activas
  const totalInStocks = computed(() => {
    // Por ahora, calculamos usando las purchases. En el futuro se puede mejorar
    // si el backend provee el valor unitario actual de las acciones
    return purchases.value
      .filter(p => {
        // Solo contar purchases que correspondan a suscripciones activas
        return stockSubscriptions.value.some(
          sub => sub.id === p.stock_subscription_id && sub.status === 'active'
        )
      })
      .reduce((sum, purchase) => sum + purchase.total_value, 0)
  })
  
  const activeLoans = computed(() => {
    return loans.value.filter(loan => loan.status === 'active')
  })
  
  const activeLoansCount = computed(() => activeLoans.value.length)
  
  const activeLoansTotalAmount = computed(() => {
    return activeLoans.value.reduce((sum, loan) => sum + loan.outstanding_balance, 0)
  })
  
  const totalPendingDues = computed(() => {
    const total = dues.value.reduce((sum, due) => {
      const amount = typeof due.amount === 'number' ? due.amount : parseFloat(String(due.amount || 0))
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)
    return isNaN(total) || !isFinite(total) ? 0 : total
  })

  async function fetchMember(id: string) {
    loading.value = true
    error.value = null
    try {
      member.value = await membersApi.getMemberById(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar miembro'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchDues(memberId: string) {
    try {
      dues.value = await membersApi.getMemberDues(memberId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar cuotas'
      throw e
    }
  }

  async function fetchPayments(memberId: string, meetingId?: string) {
    try {
      payments.value = await membersApi.getMemberPayments(memberId, meetingId ? { meeting_id: meetingId } : undefined)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar pagos'
      throw e
    }
  }

  async function fetchPurchases(memberId: string, meetingId?: string) {
    try {
      purchases.value = await membersApi.getMemberPurchases(memberId, meetingId ? { meeting_id: meetingId } : undefined)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar compras'
      throw e
    }
  }

  async function fetchLoans(memberId: string) {
    loadingLoans.value = true
    try {
      loans.value = await membersApi.getMemberLoans(memberId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar préstamos'
      throw e
    } finally {
      loadingLoans.value = false
    }
  }

  async function fetchStockSubscriptions(memberId: string, includeInactive?: boolean) {
    loadingSubscriptions.value = true
    try {
      stockSubscriptions.value = await membersApi.getMemberStockSubscriptions(memberId, includeInactive)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar suscripciones'
      throw e
    } finally {
      loadingSubscriptions.value = false
    }
  }

  async function fetchExchanges(memberId: string, query?: GetMemberStockModificationsQuery) {
    loadingExchanges.value = true
    try {
      exchanges.value = await membersApi.getMemberExchanges(memberId, query)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar intercambios'
      throw e
    } finally {
      loadingExchanges.value = false
    }
  }

  async function fetchTransfers(memberId: string, query?: GetMemberStockModificationsQuery) {
    loadingTransfers.value = true
    try {
      transfers.value = await membersApi.getMemberTransfers(memberId, query)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar transferencias'
      throw e
    } finally {
      loadingTransfers.value = false
    }
  }

  async function fetchStockLoanPayments(memberId: string, query?: GetMemberStockModificationsQuery) {
    loadingStockLoanPayments.value = true
    try {
      stockLoanPayments.value = await membersApi.getMemberStockLoanPayments(memberId, query)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar pagos con acciones'
      throw e
    } finally {
      loadingStockLoanPayments.value = false
    }
  }

  async function fetchPaymentSchedule(memberId: string, query?: GetPaymentScheduleQuery) {
    loadingPaymentSchedule.value = true
    try {
      paymentSchedule.value = await membersApi.getMemberPaymentSchedule(memberId, query)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar cronograma'
      throw e
    } finally {
      loadingPaymentSchedule.value = false
    }
  }

  async function fetchInsurance(memberId: string, capitalPayment?: number) {
    loadingInsurance.value = true
    try {
      insurance.value = await membersApi.getMemberInsurance(memberId, capitalPayment)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al calcular seguro'
      throw e
    } finally {
      loadingInsurance.value = false
    }
  }

  function reset() {
    member.value = null
    dues.value = []
    payments.value = []
    purchases.value = []
    loans.value = []
    stockSubscriptions.value = []
    exchanges.value = []
    transfers.value = []
    stockLoanPayments.value = []
    paymentSchedule.value = null
    insurance.value = null
    error.value = null
  }

  return {
    // States
    member,
    dues,
    payments,
    purchases,
    loans,
    stockSubscriptions,
    exchanges,
    transfers,
    stockLoanPayments,
    paymentSchedule,
    insurance,
    loading,
    error,
    loadingLoans,
    loadingSubscriptions,
    loadingExchanges,
    loadingTransfers,
    loadingStockLoanPayments,
    loadingPaymentSchedule,
    loadingInsurance,
    // Computed
    totalInStocks,
    activeLoans,
    activeLoansCount,
    activeLoansTotalAmount,
    totalPendingDues,
    // Functions
    fetchMember,
    fetchDues,
    fetchPayments,
    fetchPurchases,
    fetchLoans,
    fetchStockSubscriptions,
    fetchExchanges,
    fetchTransfers,
    fetchStockLoanPayments,
    fetchPaymentSchedule,
    fetchInsurance,
    reset
  }
})

