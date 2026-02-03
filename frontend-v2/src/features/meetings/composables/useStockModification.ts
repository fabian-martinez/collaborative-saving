import { ref, computed } from 'vue'
import { membersApi, type StockTransferRequest, type StockLoanPaymentRequest, type StockExchangeRequest, type StockOperationResponse } from '@/api/members.api'
import { meetingsApi, type Operation } from '@/api/meetings.api'
import { loansApi, type Loan } from '@/api/loans.api'
import { stocksApi, type Stock } from '@/api/stocks.api'
import { useActiveMeetingStore } from '../stores/activeMeeting'

export interface StockSubscription {
  id: string
  stock_id: string
  stock?: Stock
  quantity: number
  status: 'active' | 'inactive'
  member_id: string
}

export interface StockModificationForm {
  // Transfer
  transferSubscriptionId?: string
  transferQuantity?: number
  toMemberId?: string
  
  // Loan Payment
  loanPaymentSubscriptionId?: string
  loanPaymentQuantity?: number
  loanId?: string
  
  // Exchange/Modification
  fromSubscriptionId?: string
  fromQuantity?: number
  toStockId?: string
  toQuantity?: number
  differenceHandling?: 'cash' | 'credit'
  targetLoanId?: string
  notes?: string
}

export function useStockModification() {
  const store = useActiveMeetingStore()

  // State
  const registeredOperations = ref<Operation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isProcessing = ref(false)

  // Member data
  const memberSubscriptions = ref<StockSubscription[]>([])
  const memberLoans = ref<Loan[]>([])
  const availableStocks = ref<Stock[]>([])
  const loadingMemberData = ref(false)

  // Modals state
  const showTransferModal = ref(false)
  const showLoanPaymentModal = ref(false)
  const showModificationModal = ref(false)
  const showTransferReceipt = ref(false)
  const showLoanPaymentReceipt = ref(false)
  const showModificationReceipt = ref(false)

  // Selected operation for detail view
  const selectedOperation = ref<Operation | null>(null)
  const operationDetailLoadingId = ref<string | null>(null)

  // Forms
  const transferForm = ref<StockModificationForm>({})
  const loanPaymentForm = ref<StockModificationForm>({})
  const modificationForm = ref<StockModificationForm>({})

  // Receipts
  const transferReceipt = ref<{
    stockName: string
    quantity: number
    unitValue: number
    totalValue: number
    toMemberName: string
    transfer_subscription_id: string
    transfer_quantity: number
    to_member_id: string
  } | null>(null)
  const loanPaymentReceipt = ref<{
    stockName: string
    quantity: number
    unitValue: number
    totalValue: number
    loanType: string
    currentBalance: number
    newBalance: number
    loan_payment_subscription_id: string
    loan_payment_quantity: number
    loan_id: string
  } | null>(null)
  const modificationReceipt = ref<{
    fromStockName: string
    fromQuantity: number
    fromUnitValue: number
    fromValue: number
    toStockName: string
    toQuantity: number
    toUnitValue: number
    toValue: number
    difference: number
    differenceHandling: string
    from_subscription_id: string
    from_quantity: number
    to_stock_id: string
    to_quantity: number
    difference_handling?: 'cash' | 'credit'
    target_loan_id?: string
  } | null>(null)

  // Computed
  const totalOperations = computed(() => registeredOperations.value.length)

  const transfers = computed(() =>
    registeredOperations.value.filter(op => op.type === 'STOCK_TRANSFER' || op.type === 'TRANSFER')
  )

  const loanPayments = computed(() =>
    registeredOperations.value.filter(op => op.type === 'STOCK_LOAN_PAYMENT' || op.type === 'LOAN_PAYMENT')
  )

  const exchanges = computed(() =>
    registeredOperations.value.filter(op => op.type === 'STOCK_MODIFICATION' || op.type === 'STOCK_EXCHANGE' || op.type === 'EXCHANGE')
  )

  // Methods
  async function loadRegisteredOperations() {
    if (!store.meetingId) return

    loading.value = true
    error.value = null

    try {
      const [transfers, loanPayments, exchanges] = await Promise.all([
        meetingsApi.getMeetingTransfers(store.meetingId),
        meetingsApi.getMeetingStockLoanPayments(store.meetingId),
        meetingsApi.getMeetingExchanges(store.meetingId)
      ])

      registeredOperations.value = [
        ...transfers,
        ...loanPayments,
        ...exchanges
      ]
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar operaciones'
      console.error('Error loading registered operations:', e)
    } finally {
      loading.value = false
    }
  }

  async function loadMemberData(memberId: string) {
    if (!memberId) return

    loadingMemberData.value = true
    error.value = null

    try {
      // Cargar préstamos del miembro
      const loans = await loansApi.getMemberLoans(memberId)
      memberLoans.value = loans.filter(loan => loan.outstanding_balance > 0)

      // Cargar acciones disponibles
      availableStocks.value = await stocksApi.getStocks()

      // Cargar suscripciones de acciones del miembro
      const subscriptions = await membersApi.getMemberStockSubscriptions(memberId)
      
      // Mapear las suscripciones al formato esperado por el componente
      memberSubscriptions.value = subscriptions
        .filter(sub => sub.status === 'active')
        .map(sub => {
          const stock = availableStocks.value.find(s => s.id === sub.stock_id)
          return {
            id: sub.id,
            stock_id: sub.stock_id,
            stock: stock,
            quantity: sub.quantity,
            status: sub.status as 'active' | 'inactive',
            member_id: memberId
          }
        })
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar datos del socio'
      console.error('Error loading member data:', e)
    } finally {
      loadingMemberData.value = false
    }
  }

  async function processTransfer(memberId: string, data: StockTransferRequest): Promise<StockOperationResponse> {
    isProcessing.value = true
    error.value = null

    try {
      const response = await membersApi.processStockTransfer(memberId, data)
      await loadRegisteredOperations()
      return response
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al procesar transferencia'
      throw e
    } finally {
      isProcessing.value = false
    }
  }

  async function processLoanPayment(memberId: string, data: StockLoanPaymentRequest): Promise<StockOperationResponse> {
    isProcessing.value = true
    error.value = null

    try {
      const response = await membersApi.processStockLoanPayment(memberId, data)
      await loadRegisteredOperations()
      return response
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al procesar pago de crédito'
      throw e
    } finally {
      isProcessing.value = false
    }
  }

  async function processExchange(memberId: string, data: StockExchangeRequest): Promise<StockOperationResponse> {
    isProcessing.value = true
    error.value = null

    try {
      const response = await membersApi.processStockExchange(memberId, data)
      await loadRegisteredOperations()
      return response
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al procesar intercambio'
      throw e
    } finally {
      isProcessing.value = false
    }
  }

  function openTransferModal() {
    showTransferModal.value = true
    transferForm.value = {}
  }

  function closeTransferModal() {
    showTransferModal.value = false
    transferForm.value = {}
  }

  function openLoanPaymentModal() {
    showLoanPaymentModal.value = true
    loanPaymentForm.value = {}
  }

  function closeLoanPaymentModal() {
    showLoanPaymentModal.value = false
    loanPaymentForm.value = {}
  }

  function openModificationModal() {
    showModificationModal.value = true
    modificationForm.value = {}
  }

  function closeModificationModal() {
    showModificationModal.value = false
    modificationForm.value = {}
  }

  function reset() {
    registeredOperations.value = []
    memberSubscriptions.value = []
    memberLoans.value = []
    selectedOperation.value = null
    error.value = null
  }

  return {
    // State
    registeredOperations,
    loading,
    error,
    isProcessing,
    memberSubscriptions,
    memberLoans,
    availableStocks,
    loadingMemberData,
    
    // Modals
    showTransferModal,
    showLoanPaymentModal,
    showModificationModal,
    showTransferReceipt,
    showLoanPaymentReceipt,
    showModificationReceipt,
    
    // Forms
    transferForm,
    loanPaymentForm,
    modificationForm,
    
    // Receipts
    transferReceipt,
    loanPaymentReceipt,
    modificationReceipt,
    
    // Selected operation
    selectedOperation,
    operationDetailLoadingId,
    
    // Computed
    totalOperations,
    transfers,
    loanPayments,
    exchanges,
    
    // Methods
    loadRegisteredOperations,
    loadMemberData,
    processTransfer,
    processLoanPayment,
    processExchange,
    openTransferModal,
    closeTransferModal,
    openLoanPaymentModal,
    closeLoanPaymentModal,
    openModificationModal,
    closeModificationModal,
    reset
  }
}

