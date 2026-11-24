/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePaymentCollection } from '../src/features/meetings/composables/usePaymentCollection'
import { useActiveMeetingStore } from '../src/features/meetings/stores/activeMeeting'
import { membersApi, type Member, type MemberDue, type MemberPayment } from '../src/api/members.api'
import { meetingsApi, type Operation } from '../src/api/meetings.api'

/**
 * @vitest-environment jsdom
 */

const createMockMember = (overrides: Partial<Member> = {}): Member => ({
  id: 'member-1',
  name: 'Juan Pérez',
  email: 'juan@ejemplo.com',
  role: 'member',
  status: 'active',
  registration_date: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('usePaymentCollection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('loadMemberDues', () => {
    it('loads dues, computes capital payment from loans, adds insurance when > 0, and initializes payments', async () => {
      // ARRANGE
      const member = createMockMember()
      const dues: MemberDue[] = [
        {
          type: 'stock_fee',
          description: 'Cuota Acción Ordinaria',
          amount: 50000,
          reference_id: 'sub-1',
          stock_quantity: 2,
          monthly_contribution: 25000,
        },
        {
          type: 'loan_payment',
          description: 'Cuota Préstamo #1',
          amount: 120000,
          reference_id: 'loan-1',
          details: { principal: 100000, interest: 20000, outstanding_balance: 900000 },
        },
        {
          type: 'loan_payment',
          description: 'Cuota Préstamo #2',
          amount: 60000,
          reference_id: 'loan-2',
          details: { principal: 50000, interest: 10000, outstanding_balance: 400000 },
        },
      ]
      vi.spyOn(membersApi, 'getMemberDues').mockResolvedValue(dues)
      vi.spyOn(membersApi, 'getMemberInsurance').mockResolvedValue({ insurance_amount: 3500 })

      const composable = usePaymentCollection()

      // ACT
      await composable.loadMemberDues(member)

      // ASSERT
      expect(membersApi.getMemberDues).toHaveBeenCalledWith('member-1')
      expect(membersApi.getMemberInsurance).toHaveBeenCalledWith('member-1', 150000)
      expect(composable.memberDues.value).toHaveLength(4)
      expect(composable.memberDues.value[3]).toEqual({
        type: 'insurance',
        description: 'Seguro de deuda',
        amount: 3500,
      })
      expect(composable.payments.value).toEqual([
        { type: 'stock_fee', description: 'Cuota Acción Ordinaria', amount: 50000, referenceId: 'sub-1' },
        { type: 'loan_payment', description: 'Cuota Préstamo #1', amount: 120000, referenceId: 'loan-1' },
        { type: 'loan_payment', description: 'Cuota Préstamo #2', amount: 60000, referenceId: 'loan-2' },
        { type: 'insurance', description: 'Seguro de deuda', amount: 3500, referenceId: undefined },
      ])
      expect(composable.loadingDues.value).toBe(false)
      expect(composable.error.value).toBeNull()
    })

    it('calls getMemberInsurance with 0 when no loan dues exist and omits insurance when amount <= 0', async () => {
      // ARRANGE
      const member = createMockMember()
      const dues: MemberDue[] = [
        { type: 'mandatory_contribution', description: 'Aporte Obligatorio', amount: 20000 },
      ]
      vi.spyOn(membersApi, 'getMemberDues').mockResolvedValue(dues)
      vi.spyOn(membersApi, 'getMemberInsurance').mockResolvedValue({ insurance_amount: 0 })

      const composable = usePaymentCollection()

      // ACT
      await composable.loadMemberDues(member)

      // ASSERT
      expect(membersApi.getMemberInsurance).toHaveBeenCalledWith('member-1', 0)
      expect(composable.memberDues.value).toHaveLength(1)
      expect(composable.payments.value).toHaveLength(1)
    })

    it('sets backend error message or default fallback when loading dues fails', async () => {
      // ARRANGE
      const member = createMockMember()
      vi.spyOn(membersApi, 'getMemberDues').mockRejectedValueOnce({
        response: { data: { message: 'Socio no encontrado' } },
      })
      const composable = usePaymentCollection()

      // ACT
      await composable.loadMemberDues(member)

      // ASSERT
      expect(composable.error.value).toBe('Socio no encontrado')
      expect(composable.loadingDues.value).toBe(false)

      // ARRANGE fallback error
      vi.spyOn(membersApi, 'getMemberDues').mockRejectedValueOnce(new Error('Network error'))

      // ACT
      await composable.loadMemberDues(member)

      // ASSERT
      expect(composable.error.value).toBe('Error al cargar las deudas del socio.')
      expect(composable.loadingDues.value).toBe(false)
    })
  })

  describe('computed properties', () => {
    it('classifies dues, computes totalInterest, editingLoanDue, and subtracts novelties in totalToPay', () => {
      // ARRANGE
      const composable = usePaymentCollection()
      composable.memberDues.value = [
        { type: 'stock_fee', description: 'Acción A', amount: 50000, reference_id: 'sub-1' },
        { type: 'mandatory_contribution', description: 'Aporte', amount: 15000 },
        { type: 'fee', description: 'Multa inasistencia', amount: 10000 },
        { type: 'insurance', description: 'Seguro de deuda', amount: 2500 },
        { type: 'fee', description: 'Multa en cero', amount: 0 },
        {
          type: 'loan_payment',
          description: 'Préstamo 1',
          amount: 120000,
          reference_id: 'loan-1',
          details: { principal: 100000, interest: 20000, outstanding_balance: 500000 },
        },
        {
          type: 'loan_payment',
          description: 'Préstamo 2',
          amount: 55000,
          reference_id: 'loan-2',
          details: { principal: 50000, interest: 5000, outstanding_balance: 200000 },
        },
      ]
      composable.payments.value = [
        { type: 'stock_fee', description: 'Acción A', amount: 50000, referenceId: 'sub-1' },
        { type: 'mandatory_contribution', description: 'Aporte', amount: 15000 },
        { type: 'fee', description: 'Multa inasistencia', amount: 10000 },
        { type: 'insurance', description: 'Seguro de deuda', amount: 2500 },
        { type: 'loan_payment', description: 'Préstamo 1', amount: 120000, referenceId: 'loan-1' },
        { type: 'loan_payment', description: 'Préstamo 2', amount: 55000, referenceId: 'loan-2' },
        { type: 'novelty', description: 'Descuento autorizado', amount: 12500 },
      ]

      // ACT & ASSERT
      expect(composable.indexedDues.value.map((d) => d.originalIndex)).toEqual([0, 1, 2, 3, 4, 5, 6])
      expect(composable.stockDues.value).toHaveLength(1)
      expect(composable.stockDues.value[0].originalIndex).toBe(0)
      expect(composable.otherDues.value.map((d) => d.description)).toEqual([
        'Aporte',
        'Multa inasistencia',
        'Seguro de deuda',
      ])
      expect(composable.loanDues.value).toHaveLength(2)
      expect(composable.noveltyPayments.value).toHaveLength(1)
      expect(composable.totalInterest.value).toBe(25000)
      // 50000 + 15000 + 10000 + 2500 + 120000 + 55000 - 12500 = 240000
      expect(composable.totalToPay.value).toBe(240000)

      expect(composable.editingLoanDue.value).toBeNull()
      composable.editingLoanIndex.value = 5
      expect(composable.editingLoanDue.value?.reference_id).toBe('loan-1')
      composable.editingLoanIndex.value = 99
      expect(composable.editingLoanDue.value).toBeNull()
    })

    it('returns 0 for totalToPay when payments list is empty', () => {
      // ARRANGE
      const composable = usePaymentCollection()

      // ACT & ASSERT
      expect(composable.totalToPay.value).toBe(0)
    })
  })

  describe('fine management (addFine, editPayment, handleFineUpdate)', () => {
    it('creates a new fine and synchronizes both memberDues and payments', () => {
      // ARRANGE
      const composable = usePaymentCollection()
      composable.editingFineIndex.value = 0
      composable.editingFineData.value = { description: 'Prev', amount: 100 }

      // ACT
      composable.addFine()

      // ASSERT
      expect(composable.isFineModalOpen.value).toBe(true)
      expect(composable.editingFineIndex.value).toBeNull()
      expect(composable.editingFineData.value).toBeNull()

      // ACT
      composable.handleFineUpdate({ description: 'Multa por retraso', amount: 15000 })

      // ASSERT
      expect(composable.memberDues.value).toEqual([
        { type: 'fee', description: 'Multa por retraso', amount: 15000 },
      ])
      expect(composable.payments.value).toEqual([
        { type: 'fee', description: 'Multa por retraso', amount: 15000 },
      ])
      expect(composable.isFineModalOpen.value).toBe(false)
    })

    it('edits an existing fine without reference_id and syncs both arrays', () => {
      // ARRANGE
      const composable = usePaymentCollection()
      composable.memberDues.value = [
        { type: 'stock_fee', description: 'Acción', amount: 50000, reference_id: 'sub-1' },
        { type: 'fee', description: 'Multa vieja', amount: 5000 },
      ]
      composable.payments.value = [
        { type: 'stock_fee', description: 'Acción', amount: 50000, referenceId: 'sub-1' },
        { type: 'fee', description: 'Multa con ref', amount: 9000, referenceId: 'fee-other' },
        { type: 'fee', description: 'Multa vieja', amount: 7000 },
      ]

      // ACT
      composable.editPayment(1)

      // ASSERT
      expect(composable.isFineModalOpen.value).toBe(true)
      expect(composable.editingFineIndex.value).toBe(1)
      expect(composable.editingFineData.value).toEqual({
        description: 'Multa vieja',
        amount: 7000,
      })

      // ACT
      composable.handleFineUpdate({ description: 'Multa corregida', amount: 12000 })

      // ASSERT
      expect(composable.memberDues.value[1]).toEqual({
        type: 'fee',
        description: 'Multa corregida',
        amount: 12000,
      })
      expect(composable.payments.value[1]).toEqual({
        type: 'fee',
        description: 'Multa con ref',
        amount: 9000,
        referenceId: 'fee-other',
      })
      expect(composable.payments.value[2]).toEqual({
        type: 'fee',
        description: 'Multa corregida',
        amount: 12000,
      })
      expect(composable.isFineModalOpen.value).toBe(false)
      expect(composable.editingFineIndex.value).toBeNull()
      expect(composable.editingFineData.value).toBeNull()
    })

    it('edits a fine matching by referenceId and falls back to due.amount when payment is absent', () => {
      // ARRANGE
      const composable = usePaymentCollection()
      composable.memberDues.value = [
        { type: 'fee', description: 'Multa ref', amount: 8000, reference_id: 'fee-1' },
      ]
      composable.payments.value = [
        { type: 'fee', description: 'Multa ref', amount: 8000, referenceId: 'fee-1' },
      ]

      // ACT
      composable.editPayment(0)
      composable.handleFineUpdate({ description: 'Multa ref editada', amount: 9500 })

      // ASSERT
      expect(composable.payments.value[0].amount).toBe(9500)
      expect(composable.payments.value[0].description).toBe('Multa ref editada')

      // Fallback when payment does not exist
      composable.payments.value = []
      composable.editPayment(0)
      expect(composable.editingFineData.value?.amount).toBe(9500)
    })
  })

  describe('loan payment editing & dynamic insurance recalculation', () => {
    it('updates targeted loan payment among multiple loans and recalculates existing insurance', async () => {
      // ARRANGE
      const member = createMockMember()
      const composable = usePaymentCollection()
      composable.selectedMember.value = member
      composable.memberDues.value = [
        {
          type: 'loan_payment',
          description: 'Préstamo 1',
          amount: 120000,
          reference_id: 'loan-1',
          details: { principal: 100000, interest: 20000, outstanding_balance: 500000 },
        },
        {
          type: 'loan_payment',
          description: 'Préstamo 2',
          amount: 60000,
          reference_id: 'loan-2',
          details: { principal: 50000, interest: 10000, outstanding_balance: 300000 },
        },
        { type: 'insurance', description: 'Seguro de deuda', amount: 4000 },
      ]
      composable.payments.value = [
        { type: 'loan_payment', description: 'Préstamo 1', amount: 120000, referenceId: 'loan-1' },
        { type: 'loan_payment', description: 'Préstamo 2', amount: 60000, referenceId: 'loan-2' },
        { type: 'insurance', description: 'Seguro de deuda', amount: 4000 },
      ]

      vi.spyOn(membersApi, 'getMemberInsurance').mockResolvedValue({ insurance_amount: 2800 })

      // ACT
      composable.editPayment(1)
      expect(composable.isLoanModalOpen.value).toBe(true)
      expect(composable.editingLoanIndex.value).toBe(1)

      // New payment on loan-2: 110000 (100000 capital + 10000 interest)
      // Total capital = (120000 - 20000) + (110000 - 10000) = 200000
      await composable.handleLoanPaymentUpdate(110000)

      // ASSERT
      expect(composable.isLoanModalOpen.value).toBe(false)
      expect(composable.editingLoanIndex.value).toBeNull()
      expect(composable.payments.value[0].amount).toBe(120000)
      expect(composable.payments.value[1].amount).toBe(110000)
      expect(membersApi.getMemberInsurance).toHaveBeenCalledWith('member-1', 200000)
      expect(composable.memberDues.value[2].amount).toBe(2800)
      expect(composable.payments.value[2].amount).toBe(2800)
    })

    it('updates loan payment without referenceId and handles missing matching payment cleanly', async () => {
      // ARRANGE
      const composable = usePaymentCollection()
      composable.selectedMember.value = createMockMember()
      composable.memberDues.value = [
        { type: 'loan_payment', description: 'Préstamo sin ref', amount: 50000 },
      ]
      composable.payments.value = [
        { type: 'loan_payment', description: 'Préstamo con otra ref', amount: 70000, referenceId: 'other-loan' },
        { type: 'loan_payment', description: 'Préstamo sin ref', amount: 50000 },
      ]
      vi.spyOn(membersApi, 'getMemberInsurance').mockResolvedValue({ insurance_amount: 0 })

      // ACT
      composable.editPayment(0)
      await composable.handleLoanPaymentUpdate(65000)

      // ASSERT
      expect(composable.payments.value[0].amount).toBe(70000)
      expect(composable.payments.value[1].amount).toBe(65000)

      // Calling handleLoanPaymentUpdate when editingLoanIndex is null still recalculates
      await composable.handleLoanPaymentUpdate(1000)
      expect(membersApi.getMemberInsurance).toHaveBeenCalledTimes(2)
    })

    it('adds insurance row when none existed and recalculated insurance_amount > 0', async () => {
      // ARRANGE
      const composable = usePaymentCollection()
      composable.selectedMember.value = createMockMember()
      composable.memberDues.value = [
        {
          type: 'loan_payment',
          description: 'Préstamo único',
          amount: 50000,
          details: { principal: 30000, interest: 20000, outstanding_balance: 300000 },
        },
      ]
      composable.payments.value = [
        { type: 'loan_payment', description: 'Préstamo único', amount: 15000 }, // <= interest -> capital 0
      ]
      vi.spyOn(membersApi, 'getMemberInsurance').mockResolvedValue({ insurance_amount: 1500 })

      // ACT
      await composable.recalculateInsurance()

      // ASSERT
      expect(membersApi.getMemberInsurance).toHaveBeenCalledWith('member-1', 0)
      expect(composable.memberDues.value).toContainEqual({
        type: 'insurance',
        description: 'Seguro de deuda',
        amount: 1500,
      })
      expect(composable.payments.value).toContainEqual({
        type: 'insurance',
        description: 'Seguro de deuda',
        amount: 1500,
      })
    })

    it('skips recalculation when no member is selected and catches API errors gracefully', async () => {
      // ARRANGE
      const composable = usePaymentCollection()
      const insuranceSpy = vi.spyOn(membersApi, 'getMemberInsurance')

      // ACT
      await composable.recalculateInsurance()

      // ASSERT
      expect(insuranceSpy).not.toHaveBeenCalled()

      // ARRANGE error path
      composable.selectedMember.value = createMockMember()
      insuranceSpy.mockRejectedValue(new Error('Insurance service down'))

      // ACT & ASSERT (does not throw)
      await expect(composable.recalculateInsurance()).resolves.toBeUndefined()
    })
  })

  describe('novelties and payment deletion', () => {
    it('adds novelty with affectedDue metadata, normalizes negative amount, and deletes by novelty index', () => {
      // ARRANGE
      const composable = usePaymentCollection()
      composable.payments.value = [
        { type: 'stock_fee', description: 'Acción', amount: 50000, referenceId: 'sub-1' },
      ]

      composable.addNovelty()
      expect(composable.isNoveltyModalOpen.value).toBe(true)

      // ACT: save novelty with affectedDue having reference_id and negative amount
      composable.handleNoveltySave({
        amount: -10000,
        comment: 'Condonación parcial',
        affectedDue: {
          type: 'loan_payment',
          description: 'Préstamo 1',
          amount: 120000,
          reference_id: 'loan-1',
        },
      })

      // Save second novelty without comment or affectedDue
      composable.handleNoveltySave({
        amount: 5000,
        comment: '',
        affectedDue: null,
      })

      // ASSERT
      expect(composable.isNoveltyModalOpen.value).toBe(false)
      expect(composable.noveltyPayments.value).toEqual([
        {
          type: 'novelty',
          description: 'Condonación parcial',
          amount: 10000,
          noveltyComment: 'Condonación parcial',
          affectedPaymentType: 'loan_payment',
          referenceId: 'loan-1',
        },
        {
          type: 'novelty',
          description: 'Novedad',
          amount: 5000,
          noveltyComment: '',
        },
      ])

      // ACT: delete first novelty (at overall payments index 1)
      composable.deleteNovelty(0)
      expect(composable.noveltyPayments.value).toHaveLength(1)
      expect(composable.noveltyPayments.value[0].description).toBe('Novedad')

      // Out-of-bounds deleteNovelty is a safe no-op
      composable.deleteNovelty(10)
      expect(composable.payments.value).toHaveLength(2)
    })

    it('deletes payment correlated by type and referenceId even with interleaved novelties and multiple loans', () => {
      // ARRANGE
      const composable = usePaymentCollection()
      composable.memberDues.value = [
        { type: 'loan_payment', description: 'Préstamo 1', amount: 100000, reference_id: 'loan-1' },
        { type: 'loan_payment', description: 'Préstamo 2', amount: 80000, reference_id: 'loan-2' },
        { type: 'fee', description: 'Multa', amount: 5000 },
      ]
      composable.payments.value = [
        { type: 'novelty', description: 'Novedad previa', amount: 2000 },
        { type: 'loan_payment', description: 'Préstamo 1', amount: 100000, referenceId: 'loan-1' },
        { type: 'loan_payment', description: 'Préstamo 2', amount: 80000, referenceId: 'loan-2' },
        { type: 'fee', description: 'Multa', amount: 5000 },
      ]

      // ACT: delete Préstamo 2 (originalIndex 1)
      composable.deletePayment(1)

      // ASSERT
      expect(composable.memberDues.value.map((d) => d.description)).toEqual(['Préstamo 1', 'Multa'])
      expect(composable.payments.value.map((p) => p.description)).toEqual([
        'Novedad previa',
        'Préstamo 1',
        'Multa',
      ])

      // ACT: delete Multa (now at index 1 in memberDues, originalIndex 1)
      composable.deletePayment(1)
      expect(composable.memberDues.value.map((d) => d.description)).toEqual(['Préstamo 1'])
      expect(composable.payments.value.map((p) => p.description)).toEqual([
        'Novedad previa',
        'Préstamo 1',
      ])

      // Invalid index does nothing
      composable.deletePayment(99)
      expect(composable.memberDues.value).toHaveLength(1)

      // Due without reference_id when payment only has mismatched referenceId leaves payment intact
      composable.memberDues.value = [
        { type: 'loan_payment', description: 'Préstamo sin ref', amount: 40000 },
      ]
      composable.payments.value = [
        { type: 'loan_payment', description: 'Préstamo con ref', amount: 40000, referenceId: 'loan-x' },
      ]
      composable.deletePayment(0)
      expect(composable.memberDues.value).toEqual([])
      expect(composable.payments.value).toHaveLength(1)
    })
  })

  describe('handlePayment', () => {
    it('sets error and skips API when there is no active meeting', async () => {
      // ARRANGE
      const composable = usePaymentCollection()
      composable.selectedMember.value = createMockMember()
      composable.payments.value = [{ type: 'fee', description: 'Multa', amount: 5000 }]
      const recordSpy = vi.spyOn(membersApi, 'recordMonthlyPayment')

      // ACT
      await composable.handlePayment()

      // ASSERT
      expect(composable.error.value).toBe('No hay una reunión activa. No se puede registrar el pago.')
      expect(recordSpy).not.toHaveBeenCalled()
    })

    it('returns early without error when member is missing or payments is empty', async () => {
      // ARRANGE
      const store = useActiveMeetingStore()
      store.meeting = { id: 'meeting-1', date: '2026-01-15', status: 'active', notes: null, created_at: '2026-01-15' }
      const composable = usePaymentCollection()
      const recordSpy = vi.spyOn(membersApi, 'recordMonthlyPayment')

      // ACT
      await composable.handlePayment()

      // ASSERT
      expect(recordSpy).not.toHaveBeenCalled()
      expect(composable.error.value).toBeNull()
    })

    it('formats stock_fee and loan_payment descriptions, maps novelty snake_case fields, and updates completedPayments & paidMemberIds', async () => {
      // ARRANGE
      const store = useActiveMeetingStore()
      store.meeting = { id: 'meeting-1', date: '2026-01-15', status: 'active', notes: null, created_at: '2026-01-15' }

      const composable = usePaymentCollection()
      composable.selectedMember.value = createMockMember({ id: 'member-1', name: 'Ana Gómez' })
      composable.memberDues.value = [
        {
          type: 'stock_fee',
          description: 'Acción Ordinaria',
          amount: 100000,
          reference_id: 'sub-1',
          stock_quantity: 2,
          monthly_contribution: 50000,
        },
        {
          type: 'loan_payment',
          description: 'Préstamo Corriente',
          amount: 120000,
          reference_id: 'loan-1',
          details: { principal: 100000, interest: 20000, outstanding_balance: 500000 },
        },
        {
          type: 'mandatory_contribution',
          description: 'Aporte Mensual',
          amount: 15000,
        },
      ]
      composable.payments.value = [
        { type: 'stock_fee', description: 'Acción Ordinaria', amount: 100000, referenceId: 'sub-1' },
        { type: 'loan_payment', description: 'Préstamo Corriente', amount: 130000, referenceId: 'loan-1' },
        { type: 'mandatory_contribution', description: 'Aporte Mensual', amount: 15000 },
        { type: 'fee', description: 'Multa cero filtrada', amount: 0 },
        {
          type: 'novelty',
          description: 'Ajuste',
          amount: 5000,
          noveltyComment: 'Ajuste autorizado',
          affectedPaymentType: 'loan_payment',
          referenceId: 'loan-1',
        },
      ]

      vi.spyOn(membersApi, 'recordMonthlyPayment').mockResolvedValue({
        operation_id: 'op-1',
        total_amount: 240000,
      })

      // ACT
      await composable.handlePayment()

      // ASSERT
      expect(membersApi.recordMonthlyPayment).toHaveBeenCalledWith('member-1', {
        meeting_id: 'meeting-1',
        payments: [
          {
            type: 'stock_fee',
            amount: 100000,
            description: 'Acción Ordinaria, 2.00 uds. x 50000.00 c/u',
            reference_id: 'sub-1',
          },
          {
            type: 'loan_payment',
            amount: 130000,
            description: 'Préstamo Corriente, Abono Capital: 110000.00, Intereses: 20000.00',
            reference_id: 'loan-1',
          },
          {
            type: 'mandatory_contribution',
            amount: 15000,
            description: 'Aporte Mensual',
            reference_id: undefined,
          },
          {
            type: 'novelty',
            amount: 5000,
            description: 'Ajuste',
            reference_id: 'loan-1',
            novelty_comment: 'Ajuste autorizado',
            affected_payment_type: 'loan_payment',
          },
        ],
      })
      expect(composable.completedPayments.value).toEqual([{ memberName: 'Ana Gómez', amount: 240000 }])
      expect(composable.paidMemberIds.value).toEqual(['member-1'])
      expect(composable.isMemberPaid('member-1')).toBe(true)
      expect(composable.memberDues.value).toEqual([])
      expect(composable.payments.value).toEqual([])
      expect(composable.isSubmitting.value).toBe(false)

      // ACT again for same member updates existing completedPayments without duplicating paidMemberIds
      composable.payments.value = [{ type: 'fee', description: 'Multa', amount: 10000 }]
      vi.spyOn(membersApi, 'recordMonthlyPayment').mockResolvedValue({
        operation_id: 'op-2',
        total_amount: 250000,
      })
      await composable.handlePayment()

      expect(composable.completedPayments.value).toEqual([{ memberName: 'Ana Gómez', amount: 250000 }])
      expect(composable.paidMemberIds.value).toEqual(['member-1'])
    })

    it('sets error, resets isSubmitting, and rethrows when recordMonthlyPayment fails', async () => {
      // ARRANGE
      const store = useActiveMeetingStore()
      store.meeting = { id: 'meeting-1', date: '2026-01-15', status: 'active', notes: null, created_at: '2026-01-15' }
      const composable = usePaymentCollection()
      composable.selectedMember.value = createMockMember()
      composable.payments.value = [{ type: 'fee', description: 'Multa', amount: 5000 }]

      vi.spyOn(membersApi, 'recordMonthlyPayment').mockRejectedValueOnce(new Error('Fallo en servidor'))

      // ACT & ASSERT
      await expect(composable.handlePayment()).rejects.toThrow('Fallo en servidor')
      expect(composable.error.value).toBe('Fallo en servidor')
      expect(composable.isSubmitting.value).toBe(false)

      // Non-Error rejection
      vi.spyOn(membersApi, 'recordMonthlyPayment').mockRejectedValueOnce('raw failure')
      await expect(composable.handlePayment()).rejects.toBe('raw failure')
      expect(composable.error.value).toBe('Error desconocido al registrar el pago')
    })
  })

  describe('fetchMeetingPayments, mapPaymentToOperation, and reset', () => {
    it('aggregates paidMemberIds and completedPayments across operations', async () => {
      // ARRANGE
      const members = [
        createMockMember({ id: 'm1', name: 'Socio 1' }),
        createMockMember({ id: 'm2', name: 'Socio 2' }),
      ]
      const ops: Operation[] = [
        { id: 'op-1', member_id: 'm1', meeting_id: 'meeting-1', type: 'MONTHLY_PAYMENT', date: '2026-01-15', total_amount: 100000 },
        { id: 'op-2', member_id: 'm1', meeting_id: 'meeting-1', type: 'MONTHLY_PAYMENT', date: '2026-01-15', total_amount: 50000 },
        { id: 'op-3', member_id: 'm2', meeting_id: 'meeting-1', type: 'MONTHLY_PAYMENT', date: '2026-01-15', total_amount: 80000 },
        { id: 'op-4', member_id: 'unknown', meeting_id: 'meeting-1', type: 'MONTHLY_PAYMENT', date: '2026-01-15', total_amount: 20000 },
      ]
      vi.spyOn(meetingsApi, 'getMeetingPayments').mockResolvedValue(ops)

      const composable = usePaymentCollection()
      composable.completedPayments.value = [{ memberName: 'Socio 1', amount: 10 }]
      composable.paidMemberOperations.value.set('m1', [{ id: 'stale' }])

      // ACT
      await composable.fetchMeetingPayments('meeting-1', members)

      // ASSERT
      expect(composable.paidMemberIds.value).toEqual(['m1', 'm2', 'unknown'])
      expect(composable.paidMemberOperations.value.size).toBe(0)
      expect(composable.completedPayments.value).toEqual([
        { memberName: 'Socio 1', amount: 150000 },
        { memberName: 'Socio 2', amount: 80000 },
      ])
    })

    it('returns early when meetingId is empty and handles API errors gracefully', async () => {
      // ARRANGE
      const spy = vi.spyOn(meetingsApi, 'getMeetingPayments')
      const composable = usePaymentCollection()

      // ACT
      await composable.fetchMeetingPayments('', [])

      // ASSERT
      expect(spy).not.toHaveBeenCalled()

      // API rejection does not throw
      spy.mockRejectedValue(new Error('Fetch failed'))
      await expect(composable.fetchMeetingPayments('meeting-1', [])).resolves.toBeUndefined()
    })

    it('maps MemberPayment to Operation format supporting both account_type and type entries', () => {
      // ARRANGE
      const composable = usePaymentCollection()
      const payment: MemberPayment = {
        operation_id: 'op-10',
        type: 'monthly_payment',
        total_amount: 75000,
        date: '2026-02-01T10:00:00Z',
        meeting_id: 'meeting-2',
        entries: [
          { type: 'CASH', amount: 75000, description: 'Ingreso' },
          { account_type: 'STOCK_PORTFOLIO', amount: -75000 } as unknown as MemberPayment['entries'][number],
        ],
      }

      // ACT
      const mapped = composable.mapPaymentToOperation(payment, 'member-9')

      // ASSERT
      expect(mapped).toEqual({
        id: 'op-10',
        meeting_id: 'meeting-2',
        member_id: 'member-9',
        type: 'monthly_payment',
        date: '2026-02-01T10:00:00Z',
        description: '',
        ledger_entries: [
          {
            id: undefined,
            operation_id: 'op-10',
            account_type: 'CASH',
            amount: 75000,
            created_at: '2026-02-01T10:00:00Z',
            description: 'Ingreso',
          },
          {
            id: undefined,
            operation_id: 'op-10',
            account_type: 'STOCK_PORTFOLIO',
            amount: -75000,
            created_at: '2026-02-01T10:00:00Z',
            description: '',
          },
        ],
        total_debit: 0,
        total_credit: 0,
      })
    })

    it('resets dues, payments, and error while preserving selectedMember', () => {
      // ARRANGE
      const composable = usePaymentCollection()
      const member = createMockMember()
      composable.selectedMember.value = member
      composable.memberDues.value = [{ type: 'fee', description: 'Multa', amount: 1000 }]
      composable.payments.value = [{ type: 'fee', description: 'Multa', amount: 1000 }]
      composable.error.value = 'Error previo'

      // ACT
      composable.reset()

      // ASSERT
      expect(composable.memberDues.value).toEqual([])
      expect(composable.payments.value).toEqual([])
      expect(composable.error.value).toBeNull()
      expect(composable.selectedMember.value).toEqual(member)
    })
  })
})
