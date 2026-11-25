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
import {
  ledgerApi,
  type LedgerEntry
} from '@/api/ledger.api'
import {
  addOneMonth,
  formatAccountType,
  isCreditNormalAccount
} from '../utils/memberLabels'

export interface MemberAccountSummary {
  accountType: string
  accountName: string
  balance: number
  entriesCount: number
  lastDate: string | Date | null
  entries: LedgerEntry[]
}

export interface NextDueInfo {
  amount: number
  date: string | Date | null
  loanType: string | null
}

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
  const ledgerEntries = ref<LedgerEntry[]>([])
  
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
  const loadingLedger = ref(false)
  
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

  const totalStockUnits = computed(() => {
    return stockSubscriptions.value
      .filter(sub => sub.status === 'active')
      .reduce((sum, sub) => sum + (sub.quantity || 0), 0)
  })

  const lastPaymentDate = computed<string | Date | null>(() => {
    if (payments.value.length === 0) return null
    const sorted = [...payments.value].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    return sorted[0]?.date ?? null
  })

  const nextDueInfo = computed<NextDueInfo>(() => {
    const primaryLoan = activeLoans.value[0] || null
    const dateFromLastPayment = lastPaymentDate.value
      ? addOneMonth(lastPaymentDate.value)
      : null

    if (paymentSchedule.value?.summary?.next_payment_date) {
      return {
        amount:
          paymentSchedule.value.summary.next_payment_amount ||
          primaryLoan?.monthly_payment_amount ||
          0,
        date:
          dateFromLastPayment ??
          paymentSchedule.value.summary.next_payment_date,
        loanType: primaryLoan?.loan_type ?? null
      }
    }

    return {
      amount: primaryLoan?.monthly_payment_amount ?? 0,
      date: dateFromLastPayment,
      loanType: primaryLoan?.loan_type ?? null
    }
  })

  const accumulatedInsurance = computed(() => {
    return ledgerEntries.value
      .filter(entry => entry.account_type === 'INSURANCE_INCOME')
      .reduce((sum, entry) => {
        const val = typeof entry.amount === 'number' ? entry.amount : parseFloat(String(entry.amount || 0))
        return sum + (isNaN(val) ? 0 : -val)
      }, 0)
  })

  const memberAccountsSummary = computed<MemberAccountSummary[]>(() => {
    const grouped = new Map<string, LedgerEntry[]>()
    for (const entry of ledgerEntries.value) {
      const list = grouped.get(entry.account_type) ?? []
      list.push(entry)
      grouped.set(entry.account_type, list)
    }

    const result: MemberAccountSummary[] = []
    for (const [accountType, entries] of grouped.entries()) {
      const sortedEntries = [...entries].sort(
        (a, b) =>
          new Date(b.operation_date || b.created_at).getTime() -
          new Date(a.operation_date || a.created_at).getTime()
      )
      const rawSum = sortedEntries.reduce((sum, e) => {
        const val = typeof e.amount === 'number' ? e.amount : parseFloat(String(e.amount || 0))
        return sum + (isNaN(val) ? 0 : val)
      }, 0)
      const balance = isCreditNormalAccount(accountType) ? -rawSum : rawSum
      const firstEntry = sortedEntries[0]
      result.push({
        accountType,
        accountName: formatAccountType(accountType),
        balance,
        entriesCount: sortedEntries.length,
        lastDate: firstEntry ? firstEntry.operation_date || firstEntry.created_at : null,
        entries: sortedEntries
      })
    }

    return result.sort((a, b) => {
      if (a.accountType === 'INSURANCE_INCOME') return -1
      if (b.accountType === 'INSURANCE_INCOME') return 1
      return a.accountName.localeCompare(b.accountName)
    })
  })

  function getSubscriptionFinancials(sub: StockSubscription): {
    subscriptionValue: number
    currentFee: number
  } {
    const matchingPurchases = purchases.value.filter(
      p => p.stock_subscription_id === sub.id
    )
    const matchingDue = dues.value.find(
      d =>
        d.type === 'stock_fee' &&
        (d.reference_id === sub.id ||
          d.description.toLowerCase().includes(sub.stock_type.toLowerCase()))
    )

    const firstPurchase = matchingPurchases[0]
    const quantity = sub.quantity || 0
    const unitValue =
      firstPurchase?.unit_value ||
      (firstPurchase && quantity > 0 ? firstPurchase.total_value / quantity : 0) ||
      (matchingDue && quantity > 0 ? Number(matchingDue.amount) / quantity : 0)

    const subscriptionValue = unitValue
    const currentFee = unitValue * quantity

    return { subscriptionValue, currentFee }
  }

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

  async function fetchMemberLedgerEntries(memberId: string) {
    loadingLedger.value = true
    try {
      const response = await ledgerApi.getLedgerEntries({
        member_id: memberId,
        limit: 500,
        order_by: 'DESC'
      })
      ledgerEntries.value = response.data || []
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar cuentas del socio'
      throw e
    } finally {
      loadingLedger.value = false
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
    ledgerEntries.value = []
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
    ledgerEntries,
    loading,
    error,
    loadingLoans,
    loadingSubscriptions,
    loadingExchanges,
    loadingTransfers,
    loadingStockLoanPayments,
    loadingPaymentSchedule,
    loadingInsurance,
    loadingLedger,
    // Computed
    totalInStocks,
    totalStockUnits,
    activeLoans,
    activeLoansCount,
    activeLoansTotalAmount,
    totalPendingDues,
    lastPaymentDate,
    nextDueInfo,
    accumulatedInsurance,
    memberAccountsSummary,
    // Functions
    getSubscriptionFinancials,
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
    fetchMemberLedgerEntries,
    reset
  }
})

