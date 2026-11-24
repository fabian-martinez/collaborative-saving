/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStockModification } from '../src/features/meetings/composables/useStockModification'
import { useActiveMeetingStore } from '../src/features/meetings/stores/activeMeeting'
import { meetingsApi, type Operation } from '../src/api/meetings.api'
import { membersApi, type StockSubscription, type StockOperationResponse, type RecordExtraordinaryLoanPaymentResponse } from '../src/api/members.api'
import { loansApi, type Loan } from '../src/api/loans.api'
import { stocksApi, type Stock } from '../src/api/stocks.api'

/**
 * @vitest-environment jsdom
 */

const createMockOperation = (overrides: Partial<Operation> = {}): Operation => ({
  id: 'op-1',
  meeting_id: 'meeting-1',
  member_id: 'member-1',
  type: 'STOCK_TRANSFER',
  date: '2026-01-15T10:00:00.000Z',
  total_amount: 100000,
  ...overrides,
})

const createMockStock = (overrides: Partial<Stock> = {}): Stock => ({
  id: 'stock-1',
  name: 'Acción Ordinaria',
  type: 'Acción Ordinaria',
  value: 50000,
  monthly_contribution: 25000,
  is_guaranteed: false,
  behavior: 'CAPITAL_APPRECIATION',
  created_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

const createMockLoan = (overrides: Partial<Loan> = {}): Loan => ({
  id: 'loan-1',
  member_id: 'member-1',
  loan_type: 'corriente',
  approved_amount: 500000,
  disbursed_amount: 500000,
  outstanding_balance: 300000,
  monthly_payment_amount: 50000,
  interest_rate: 0.02,
  term: 12,
  status: 'active',
  creation_date: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('useStockModification', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('loadRegisteredOperations', () => {
    it('returns early when store.meetingId is null', async () => {
      // ARRANGE
      const composable = useStockModification()
      const transfersSpy = vi.spyOn(meetingsApi, 'getMeetingTransfers')

      // ACT
      await composable.loadRegisteredOperations()

      // ASSERT
      expect(transfersSpy).not.toHaveBeenCalled()
      expect(composable.registeredOperations.value).toEqual([])
    })

    it('loads operations in parallel, filters LOAN_PAYMENT from payments, and deduplicates by id', async () => {
      // ARRANGE
      const store = useActiveMeetingStore()
      store.meeting = { id: 'meeting-1', date: '2026-01-15', status: 'active', notes: null, created_at: '2026-01-15' }

      const opTransfer = createMockOperation({ id: 'op-t1', type: 'STOCK_TRANSFER' })
      const opStockLoan = createMockOperation({ id: 'op-lp1', type: 'STOCK_LOAN_PAYMENT' })
      const opExchange = createMockOperation({ id: 'op-ex1', type: 'STOCK_EXCHANGE' })
      const opCashLoan = createMockOperation({ id: 'op-cash1', type: 'LOAN_PAYMENT' })
      const opDuplicateCashLoan = createMockOperation({ id: 'op-lp1', type: 'LOAN_PAYMENT' })
      const opMonthly = createMockOperation({ id: 'op-mp1', type: 'MONTHLY_PAYMENT' })
      const opNoId = { ...createMockOperation({ type: 'TRANSFER' }), id: '' }

      vi.spyOn(meetingsApi, 'getMeetingTransfers').mockResolvedValue([opTransfer, opNoId])
      vi.spyOn(meetingsApi, 'getMeetingStockLoanPayments').mockResolvedValue([opStockLoan])
      vi.spyOn(meetingsApi, 'getMeetingExchanges').mockResolvedValue([opExchange])
      vi.spyOn(meetingsApi, 'getMeetingPayments').mockResolvedValue([
        opCashLoan,
        opDuplicateCashLoan,
        opMonthly,
      ])

      const composable = useStockModification()

      // ACT
      await composable.loadRegisteredOperations()

      // ASSERT
      expect(meetingsApi.getMeetingTransfers).toHaveBeenCalledWith('meeting-1')
      expect(meetingsApi.getMeetingStockLoanPayments).toHaveBeenCalledWith('meeting-1')
      expect(meetingsApi.getMeetingExchanges).toHaveBeenCalledWith('meeting-1')
      expect(meetingsApi.getMeetingPayments).toHaveBeenCalledWith('meeting-1')

      expect(composable.registeredOperations.value).toHaveLength(4)
      expect(composable.totalOperations.value).toBe(4)
      expect(composable.transfers.value.map((o) => o.id)).toEqual(['op-t1'])
      expect(composable.loanPayments.value.map((o) => o.id)).toEqual(['op-lp1', 'op-cash1'])
      expect(composable.exchanges.value.map((o) => o.id)).toEqual(['op-ex1'])
      expect(composable.loading.value).toBe(false)
      expect(composable.error.value).toBeNull()
    })

    it('ignores getMeetingPayments failure via fallback empty array', async () => {
      // ARRANGE
      const store = useActiveMeetingStore()
      store.meeting = { id: 'meeting-1', date: '2026-01-15', status: 'active', notes: null, created_at: '2026-01-15' }

      vi.spyOn(meetingsApi, 'getMeetingTransfers').mockResolvedValue([
        createMockOperation({ id: 'op-t1', type: 'TRANSFER' }),
      ])
      vi.spyOn(meetingsApi, 'getMeetingStockLoanPayments').mockResolvedValue([])
      vi.spyOn(meetingsApi, 'getMeetingExchanges').mockResolvedValue([
        createMockOperation({ id: 'op-m1', type: 'STOCK_MODIFICATION' }),
        createMockOperation({ id: 'op-e1', type: 'EXCHANGE' }),
      ])
      vi.spyOn(meetingsApi, 'getMeetingPayments').mockRejectedValue(new Error('Payments endpoint down'))

      const composable = useStockModification()

      // ACT
      await composable.loadRegisteredOperations()

      // ASSERT
      expect(composable.registeredOperations.value).toHaveLength(3)
      expect(composable.transfers.value).toHaveLength(1)
      expect(composable.exchanges.value).toHaveLength(2)
      expect(composable.error.value).toBeNull()
    })

    it('sets error when primary operation endpoints reject', async () => {
      // ARRANGE
      const store = useActiveMeetingStore()
      store.meeting = { id: 'meeting-1', date: '2026-01-15', status: 'active', notes: null, created_at: '2026-01-15' }

      vi.spyOn(meetingsApi, 'getMeetingTransfers').mockRejectedValueOnce(new Error('Error de red'))
      vi.spyOn(meetingsApi, 'getMeetingStockLoanPayments').mockResolvedValue([])
      vi.spyOn(meetingsApi, 'getMeetingExchanges').mockResolvedValue([])
      vi.spyOn(meetingsApi, 'getMeetingPayments').mockResolvedValue([])

      const composable = useStockModification()

      // ACT
      await composable.loadRegisteredOperations()

      // ASSERT
      expect(composable.error.value).toBe('Error de red')
      expect(composable.loading.value).toBe(false)

      // Non-Error rejection
      vi.spyOn(meetingsApi, 'getMeetingTransfers').mockRejectedValueOnce('unknown error')
      await composable.loadRegisteredOperations()
      expect(composable.error.value).toBe('Error al cargar operaciones')
    })
  })

  describe('loadMemberData', () => {
    it('returns early when memberId is empty', async () => {
      // ARRANGE
      const composable = useStockModification()
      const loansSpy = vi.spyOn(loansApi, 'getMemberLoans')

      // ACT
      await composable.loadMemberData('')

      // ASSERT
      expect(loansSpy).not.toHaveBeenCalled()
    })

    it('filters loans with outstanding_balance > 0 and active subscriptions mapped with stocks', async () => {
      // ARRANGE
      const loans: Loan[] = [
        createMockLoan({ id: 'loan-active', outstanding_balance: 250000 }),
        createMockLoan({ id: 'loan-paid', outstanding_balance: 0 }),
      ]
      const stocks: Stock[] = [createMockStock({ id: 'stock-1' })]
      const subscriptions: StockSubscription[] = [
        {
          id: 'sub-1',
          stock_id: 'stock-1',
          stock_type: 'Acción Ordinaria',
          quantity: 5,
          purchase_date: '2026-01-01',
          status: 'active',
        },
        {
          id: 'sub-2',
          stock_id: 'stock-missing',
          stock_type: 'Otra Acción',
          quantity: 2,
          purchase_date: '2026-01-01',
          status: 'active',
        },
        {
          id: 'sub-3',
          stock_id: 'stock-1',
          stock_type: 'Acción Ordinaria',
          quantity: 3,
          purchase_date: '2026-01-01',
          status: 'inactive',
        },
      ]

      vi.spyOn(loansApi, 'getMemberLoans').mockResolvedValue(loans)
      vi.spyOn(stocksApi, 'getStocks').mockResolvedValue(stocks)
      vi.spyOn(membersApi, 'getMemberStockSubscriptions').mockResolvedValue(subscriptions)

      const composable = useStockModification()

      // ACT
      await composable.loadMemberData('member-1')

      // ASSERT
      expect(loansApi.getMemberLoans).toHaveBeenCalledWith('member-1')
      expect(stocksApi.getStocks).toHaveBeenCalled()
      expect(membersApi.getMemberStockSubscriptions).toHaveBeenCalledWith('member-1')

      expect(composable.memberLoans.value).toHaveLength(1)
      expect(composable.memberLoans.value[0].id).toBe('loan-active')
      expect(composable.availableStocks.value).toEqual(stocks)
      expect(composable.memberSubscriptions.value).toEqual([
        {
          id: 'sub-1',
          stock_id: 'stock-1',
          stock: stocks[0],
          quantity: 5,
          status: 'active',
          member_id: 'member-1',
        },
        {
          id: 'sub-2',
          stock_id: 'stock-missing',
          stock: undefined,
          quantity: 2,
          status: 'active',
          member_id: 'member-1',
        },
      ])
      expect(composable.loadingMemberData.value).toBe(false)
      expect(composable.error.value).toBeNull()
    })

    it('sets error and resets loadingMemberData when loading fails', async () => {
      // ARRANGE
      vi.spyOn(loansApi, 'getMemberLoans').mockRejectedValueOnce(new Error('Fallo préstamos'))
      const composable = useStockModification()

      // ACT
      await composable.loadMemberData('member-1')

      // ASSERT
      expect(composable.error.value).toBe('Fallo préstamos')
      expect(composable.loadingMemberData.value).toBe(false)

      // Non-Error rejection
      vi.spyOn(loansApi, 'getMemberLoans').mockRejectedValueOnce('fail')
      await composable.loadMemberData('member-1')
      expect(composable.error.value).toBe('Error al cargar datos del socio')
    })
  })

  describe('stock modification operations', () => {
    it('executes processTransfer, reloads registered operations, and handles errors', async () => {
      // ARRANGE
      const store = useActiveMeetingStore()
      store.meeting = { id: 'meeting-1', date: '2026-01-15', status: 'active', notes: null, created_at: '2026-01-15' }

      const apiResponse: StockOperationResponse = { operation_id: 'op-t1', message: 'Transferido' }
      vi.spyOn(membersApi, 'processStockTransfer').mockResolvedValueOnce(apiResponse)
      vi.spyOn(meetingsApi, 'getMeetingTransfers').mockResolvedValue([createMockOperation({ id: 'op-t1' })])
      vi.spyOn(meetingsApi, 'getMeetingStockLoanPayments').mockResolvedValue([])
      vi.spyOn(meetingsApi, 'getMeetingExchanges').mockResolvedValue([])
      vi.spyOn(meetingsApi, 'getMeetingPayments').mockResolvedValue([])

      const composable = useStockModification()
      const payload = {
        transfer_subscription_id: 'sub-1',
        transfer_quantity: 2,
        to_member_id: 'member-2',
      }

      // ACT
      const result = await composable.processTransfer('member-1', payload)

      // ASSERT
      expect(membersApi.processStockTransfer).toHaveBeenCalledWith('member-1', payload)
      expect(result).toEqual(apiResponse)
      expect(composable.registeredOperations.value).toHaveLength(1)
      expect(composable.isProcessing.value).toBe(false)

      // Error handling
      vi.spyOn(membersApi, 'processStockTransfer').mockRejectedValueOnce(new Error('Saldo insuficiente'))
      await expect(composable.processTransfer('member-1', payload)).rejects.toThrow('Saldo insuficiente')
      expect(composable.error.value).toBe('Saldo insuficiente')
      expect(composable.isProcessing.value).toBe(false)

      vi.spyOn(membersApi, 'processStockTransfer').mockRejectedValueOnce('string error')
      await expect(composable.processTransfer('member-1', payload)).rejects.toBe('string error')
      expect(composable.error.value).toBe('Error al procesar transferencia')
    })

    it('executes processLoanPayment, reloads registered operations, and handles errors', async () => {
      // ARRANGE
      const store = useActiveMeetingStore()
      store.meeting = { id: 'meeting-1', date: '2026-01-15', status: 'active', notes: null, created_at: '2026-01-15' }

      const apiResponse: StockOperationResponse = { operation_id: 'op-lp1', message: 'Abono registrado' }
      vi.spyOn(membersApi, 'processStockLoanPayment').mockResolvedValueOnce(apiResponse)
      vi.spyOn(meetingsApi, 'getMeetingTransfers').mockResolvedValue([])
      vi.spyOn(meetingsApi, 'getMeetingStockLoanPayments').mockResolvedValue([
        createMockOperation({ id: 'op-lp1', type: 'STOCK_LOAN_PAYMENT' }),
      ])
      vi.spyOn(meetingsApi, 'getMeetingExchanges').mockResolvedValue([])
      vi.spyOn(meetingsApi, 'getMeetingPayments').mockResolvedValue([])

      const composable = useStockModification()
      const payload = {
        loan_payment_subscription_id: 'sub-1',
        loan_payment_quantity: 1,
        loan_id: 'loan-1',
      }

      // ACT
      const result = await composable.processLoanPayment('member-1', payload)

      // ASSERT
      expect(membersApi.processStockLoanPayment).toHaveBeenCalledWith('member-1', payload)
      expect(result).toEqual(apiResponse)
      expect(composable.loanPayments.value).toHaveLength(1)
      expect(composable.isProcessing.value).toBe(false)

      // Error handling
      vi.spyOn(membersApi, 'processStockLoanPayment').mockRejectedValueOnce(new Error('Crédito cerrado'))
      await expect(composable.processLoanPayment('member-1', payload)).rejects.toThrow('Crédito cerrado')
      expect(composable.error.value).toBe('Crédito cerrado')

      vi.spyOn(membersApi, 'processStockLoanPayment').mockRejectedValueOnce('raw')
      await expect(composable.processLoanPayment('member-1', payload)).rejects.toBe('raw')
      expect(composable.error.value).toBe('Error al procesar pago de crédito')
    })

    it('executes processExchange, reloads registered operations, and handles errors', async () => {
      // ARRANGE
      const store = useActiveMeetingStore()
      store.meeting = { id: 'meeting-1', date: '2026-01-15', status: 'active', notes: null, created_at: '2026-01-15' }

      const apiResponse: StockOperationResponse = { operation_id: 'op-ex1', message: 'Intercambio exitoso' }
      vi.spyOn(membersApi, 'processStockExchange').mockResolvedValueOnce(apiResponse)
      vi.spyOn(meetingsApi, 'getMeetingTransfers').mockResolvedValue([])
      vi.spyOn(meetingsApi, 'getMeetingStockLoanPayments').mockResolvedValue([])
      vi.spyOn(meetingsApi, 'getMeetingExchanges').mockResolvedValue([
        createMockOperation({ id: 'op-ex1', type: 'STOCK_EXCHANGE' }),
      ])
      vi.spyOn(meetingsApi, 'getMeetingPayments').mockResolvedValue([])

      const composable = useStockModification()
      const payload = {
        from_subscription_id: 'sub-1',
        from_quantity: 2,
        to_stock_id: 'stock-2',
        to_quantity: 1,
        difference_handling: 'cash' as const,
      }

      // ACT
      const result = await composable.processExchange('member-1', payload)

      // ASSERT
      expect(membersApi.processStockExchange).toHaveBeenCalledWith('member-1', payload)
      expect(result).toEqual(apiResponse)
      expect(composable.exchanges.value).toHaveLength(1)
      expect(composable.isProcessing.value).toBe(false)

      // Error handling
      vi.spyOn(membersApi, 'processStockExchange').mockRejectedValueOnce(new Error('Acción inválida'))
      await expect(composable.processExchange('member-1', payload)).rejects.toThrow('Acción inválida')
      expect(composable.error.value).toBe('Acción inválida')

      vi.spyOn(membersApi, 'processStockExchange').mockRejectedValueOnce('raw')
      await expect(composable.processExchange('member-1', payload)).rejects.toBe('raw')
      expect(composable.error.value).toBe('Error al procesar intercambio')
    })

    it('validates active meeting in processCashLoanPayment, reloads operations and member data, and handles errors', async () => {
      // ARRANGE
      const composable = useStockModification()
      const recordSpy = vi.spyOn(membersApi, 'recordExtraordinaryLoanPayment')

      // ACT & ASSERT without active meeting
      await expect(
        composable.processCashLoanPayment('member-1', { loanId: 'loan-1', amount: 100000 })
      ).rejects.toThrow('No hay una reunión activa')
      expect(composable.error.value).toBe('No hay una reunión activa')
      expect(composable.isProcessing.value).toBe(false)
      expect(recordSpy).not.toHaveBeenCalled()

      // ARRANGE with active meeting
      const store = useActiveMeetingStore()
      store.meeting = { id: 'meeting-1', date: '2026-01-15', status: 'active', notes: null, created_at: '2026-01-15' }

      recordSpy.mockResolvedValue({
        loanId: 'loan-1',
        operationId: 'op-cash1',
        interestPaid: 0,
        principalPaid: 100000,
        newOutstandingBalance: 200000,
        loanStatus: 'active',
        transactionDetailIds: ['td-1'],
      } satisfies RecordExtraordinaryLoanPaymentResponse)
      vi.spyOn(meetingsApi, 'getMeetingTransfers').mockResolvedValue([])
      vi.spyOn(meetingsApi, 'getMeetingStockLoanPayments').mockResolvedValue([])
      vi.spyOn(meetingsApi, 'getMeetingExchanges').mockResolvedValue([])
      vi.spyOn(meetingsApi, 'getMeetingPayments').mockResolvedValue([
        createMockOperation({ id: 'op-cash1', type: 'LOAN_PAYMENT' }),
      ])
      vi.spyOn(loansApi, 'getMemberLoans').mockResolvedValue([
        createMockLoan({ id: 'loan-1', outstanding_balance: 200000 }),
      ])
      vi.spyOn(stocksApi, 'getStocks').mockResolvedValue([])
      vi.spyOn(membersApi, 'getMemberStockSubscriptions').mockResolvedValue([])

      // ACT
      await composable.processCashLoanPayment('member-1', { loanId: 'loan-1', amount: 100000 })

      // ASSERT
      expect(recordSpy).toHaveBeenCalledWith('member-1', {
        loanId: 'loan-1',
        amount: 100000,
        meetingId: 'meeting-1',
        notes: 'Abono extraordinario a capital préstamo en efectivo',
      })
      expect(composable.registeredOperations.value).toHaveLength(1)
      expect(composable.memberLoans.value[0].outstanding_balance).toBe(200000)
      expect(composable.isProcessing.value).toBe(false)

      // Custom notes & non-Error failure
      recordSpy.mockRejectedValueOnce('raw cash error')
      await expect(
        composable.processCashLoanPayment('member-1', {
          loanId: 'loan-1',
          amount: 50000,
          notes: 'Abono parcial',
        })
      ).rejects.toBe('raw cash error')
      expect(recordSpy).toHaveBeenLastCalledWith('member-1', {
        loanId: 'loan-1',
        amount: 50000,
        meetingId: 'meeting-1',
        notes: 'Abono parcial',
      })
      expect(composable.error.value).toBe('Error al procesar abono en efectivo')
    })
  })

  describe('modal helpers and reset', () => {
    it('opens and closes all four modals while clearing forms, and resets state', () => {
      // ARRANGE
      const composable = useStockModification()
      composable.transferForm.value = { transferQuantity: 2 }
      composable.loanPaymentForm.value = { loanPaymentQuantity: 1 }
      composable.modificationForm.value = { fromQuantity: 3 }
      composable.cashLoanPaymentForm.value = { amount: 50000 }

      // ACT & ASSERT
      composable.openTransferModal()
      expect(composable.showTransferModal.value).toBe(true)
      expect(composable.transferForm.value).toEqual({})
      composable.transferForm.value = { transferQuantity: 4 }
      composable.closeTransferModal()
      expect(composable.showTransferModal.value).toBe(false)
      expect(composable.transferForm.value).toEqual({})

      composable.openLoanPaymentModal()
      expect(composable.showLoanPaymentModal.value).toBe(true)
      expect(composable.loanPaymentForm.value).toEqual({})
      composable.closeLoanPaymentModal()
      expect(composable.showLoanPaymentModal.value).toBe(false)

      composable.openModificationModal()
      expect(composable.showModificationModal.value).toBe(true)
      expect(composable.modificationForm.value).toEqual({})
      composable.closeModificationModal()
      expect(composable.showModificationModal.value).toBe(false)

      composable.openCashLoanPaymentModal()
      expect(composable.showCashLoanPaymentModal.value).toBe(true)
      expect(composable.cashLoanPaymentForm.value).toEqual({})
      composable.closeCashLoanPaymentModal()
      expect(composable.showCashLoanPaymentModal.value).toBe(false)

      // Reset
      composable.registeredOperations.value = [createMockOperation()]
      composable.memberLoans.value = [createMockLoan()]
      composable.selectedOperation.value = createMockOperation()
      composable.error.value = 'Some error'
      composable.reset()

      expect(composable.registeredOperations.value).toEqual([])
      expect(composable.memberSubscriptions.value).toEqual([])
      expect(composable.memberLoans.value).toEqual([])
      expect(composable.selectedOperation.value).toBeNull()
      expect(composable.error.value).toBeNull()
    })
  })
})
