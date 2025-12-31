import { ref, computed, type Ref } from 'vue'
import { membersApi, type Member, type MemberDue, type MemberPayment } from '@/api/members.api'
import { useActiveMeetingStore } from '../stores/activeMeeting'
import { sumCashEntries } from '@/shared/utils'

export interface Payment {
  type: string
  description: string
  amount: number
  referenceId?: string
  noveltyComment?: string
}

export interface CompletedPayment {
  memberName: string
  amount: number
}

export function usePaymentCollection() {
  const store = useActiveMeetingStore()
  const selectedMember = ref<Member | null>(null)

  // State
  const memberDues = ref<MemberDue[]>([])
  const payments = ref<Payment[]>([])
  const completedPayments = ref<CompletedPayment[]>([])
  const paidMemberIds = ref<string[]>([])
  const paidMemberOperations = ref<Map<string, any[]>>(new Map())
  const loadingDues = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  // Modals state
  const isLoanModalOpen = ref(false)
  const editingLoanIndex = ref<number | null>(null)
  const isFineModalOpen = ref(false)
  const editingFineData = ref<{ description: string; amount: number } | null>(null)
  const editingFineIndex = ref<number | null>(null)
  const isNoveltyModalOpen = ref(false)

  // Computed
  const indexedDues = computed(() =>
    memberDues.value.map((due, index) => ({ ...due, originalIndex: index }))
  )

  const stockDues = computed(() =>
    indexedDues.value.filter((due) => due.type === 'stock_fee')
  )

  const otherDues = computed(() =>
    indexedDues.value.filter(
      (due) =>
        (due.type === 'mandatory_contribution' ||
          due.type === 'fee' ||
          due.type === 'insurance') &&
        due.amount > 0
    )
  )

  const loanDues = computed(() =>
    indexedDues.value.filter((due) => due.type === 'loan_payment')
  )

  const noveltyPayments = computed(() =>
    payments.value.filter((p) => p.type === 'novelty')
  )

  const editingLoanDue = computed(() => {
    if (editingLoanIndex.value === null) return null
    return (
      indexedDues.value.find(
        (due) => due.originalIndex === editingLoanIndex.value
      ) || null
    )
  })

  const totalToPay = computed(() => {
    if (!payments.value) return 0
    return payments.value.reduce((sum, payment) => {
      if (payment.type === 'novelty') {
        return sum - Number(payment.amount || 0)
      }
      return sum + Number(payment.amount || 0)
    }, 0)
  })

  const totalInterest = computed(() => {
    return loanDues.value.reduce(
      (sum, due) => sum + (due.details?.interest || 0),
      0
    )
  })

  // Helpers
  function isMemberPaid(memberId: string): boolean {
    return paidMemberIds.value.includes(memberId)
  }

  /**
   * Mapea la respuesta del endpoint V2 de pagos del miembro al formato Operation
   * El API devuelve MemberPayment con entries que son LedgerEntry (tienen account_type)
   */
  function mapPaymentToOperation(
    payment: MemberPayment,
    memberId: string
  ): any {
    const entries = payment.entries || []

    // Los entries del API ya son LedgerEntry con account_type, los usamos directamente
    // Agregamos operation_id y created_at si no están presentes
    const ledgerEntries = entries.map((entry: any) => ({
      id: entry.id,
      operation_id: entry.operation_id || payment.operation_id,
      account_type:
        entry.account_type || entry.type || '', // Usar account_type (LedgerEntry) o type (MemberPaymentEntry)
      amount: Number(entry.amount) || 0,
      created_at: entry.created_at || payment.date,
      description: entry.description || '',
    }))

    return {
      id: payment.operation_id,
      meeting_id: payment.meeting_id,
      member_id: memberId,
      type: payment.type,
      date: payment.date,
      description: payment.description || '',
      ledger_entries: ledgerEntries,
      total_debit: 0,
      total_credit: 0,
    }
  }

  // Payment management functions
  function handleFineUpdate(data: { description: string; amount: number }) {
    const amount = Number(data.amount) || 0
    if (editingFineIndex.value !== null) {
      const index = editingFineIndex.value
      memberDues.value[index].description = data.description
      memberDues.value[index].amount = amount
      payments.value[index].amount = amount
      payments.value[index].description = data.description
    } else {
      const fineDue: MemberDue = {
        type: 'fee',
        description: data.description,
        amount: amount,
      }
      memberDues.value.push(fineDue)
      const finePayment: Payment = {
        type: 'fee',
        description: data.description,
        amount: amount,
      }
      payments.value.push(finePayment)
    }
    isFineModalOpen.value = false
    editingFineIndex.value = null
    editingFineData.value = null
  }

  async function handleLoanPaymentUpdate(newAmount: number) {
    const amount = Number(newAmount) || 0
    if (editingLoanIndex.value !== null) {
      payments.value[editingLoanIndex.value].amount = amount
    }
    isLoanModalOpen.value = false
    await recalculateInsurance()
    editingLoanIndex.value = null
  }

  function deletePayment(index: number) {
    const originalDueIndex = indexedDues.value.findIndex(
      (d) => d.originalIndex === index
    )
    if (originalDueIndex > -1) {
      memberDues.value.splice(originalDueIndex, 1)
      payments.value.splice(originalDueIndex, 1)
    }
  }

  function editPayment(index: number) {
    const dueType = memberDues.value[index].type
    if (dueType === 'loan_payment') {
      editingLoanIndex.value = index
      isLoanModalOpen.value = true
    } else if (dueType === 'fee') {
      editingFineIndex.value = index
      editingFineData.value = {
        description: memberDues.value[index].description,
        amount: payments.value[index].amount,
      }
      isFineModalOpen.value = true
    }
  }

  function addFine() {
    editingFineIndex.value = null
    editingFineData.value = null
    isFineModalOpen.value = true
  }

  function addNovelty() {
    isNoveltyModalOpen.value = true
  }

  function handleNoveltySave(data: { amount: number; comment: string }) {
    const amount = Number(data.amount) || 0
    payments.value.push({
      type: 'novelty',
      description: data.comment || 'Novedad',
      amount: Math.abs(amount),
      noveltyComment: data.comment,
    })
    isNoveltyModalOpen.value = false
  }

  function deleteNovelty(idx: number) {
    const allNovelty = payments.value.reduce<{ idx: number; i: number }[]>(
      (acc, p, i) => {
        if (p.type === 'novelty') acc.push({ idx: acc.length, i })
        return acc
      },
      []
    )
    const toDelete = allNovelty.find((n) => n.idx === idx)
    if (toDelete) payments.value.splice(toDelete.i, 1)
  }

  async function recalculateInsurance() {
    if (!selectedMember.value) return
    let totalCapitalPayment = 0
    payments.value.forEach((payment, index) => {
      const due = memberDues.value[index]
      if (due && due.type === 'loan_payment' && due.details) {
        const capitalPortion =
          payment.amount - (due.details.interest || 0)
        totalCapitalPayment += capitalPortion > 0 ? capitalPortion : 0
      }
    })

    try {
      const { insurance_amount } = await membersApi.getMemberInsurance(
        selectedMember.value.id,
        totalCapitalPayment
      )
      const insuranceDueIndex = memberDues.value.findIndex(
        (d) => d.type === 'insurance'
      )
      if (insuranceDueIndex !== -1) {
        const amount = Number(insurance_amount) || 0
        memberDues.value[insuranceDueIndex].amount = amount
        payments.value[insuranceDueIndex].amount = amount
      } else if (insurance_amount > 0) {
        const amount = Number(insurance_amount) || 0
        const insuranceDue: MemberDue = {
          type: 'insurance',
          description: 'Seguro de deuda',
          amount: amount,
        }
        memberDues.value.push(insuranceDue)
        payments.value.push({
          type: 'insurance',
          description: 'Seguro de deuda',
          amount: amount,
        })
      }
    } catch (error) {
      console.error('Error recalculating insurance:', error)
    }
  }

  async function loadMemberDues(member: Member) {
    try {
      loadingDues.value = true
      error.value = null
      const dues = await membersApi.getMemberDues(member.id)

      // Fetch and add insurance
      // El seguro se calcula basándose en la deuda total menos ahorros
      // capitalPayment es opcional (default 0) - se calcula desde los préstamos
      const capitalPayment = dues
        .filter((due) => due.type === 'loan_payment')
        .reduce((sum, due) => sum + (due.details?.principal || 0), 0)
      
      // Calcular seguro siempre (incluso si capitalPayment es 0)
      // El backend calcula el seguro basándose en deuda total - ahorros - capitalPayment
      const { insurance_amount } = await membersApi.getMemberInsurance(
        member.id,
        capitalPayment
      )
      if (insurance_amount > 0) {
        dues.push({
          type: 'insurance',
          description: 'Seguro de deuda',
          amount: insurance_amount,
        })
      }

      memberDues.value = dues

      // Initialize payment payload from dues
      payments.value = dues.map((due) => ({
        type: due.type,
        description: due.description,
        amount: Number(due.amount) || 0,
        referenceId: due.reference_id,
      }))
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } }
      console.error('Error fetching member dues:', err)
      error.value =
        apiError.response?.data?.message ||
        'Error al cargar las deudas del socio.'
    } finally {
      loadingDues.value = false
    }
  }

  async function handlePayment(): Promise<void> {
    if (
      !selectedMember.value ||
      payments.value.length === 0 ||
      !store.meetingId
    ) {
      if (!store.meetingId) {
        error.value =
          'No hay una reunión activa. No se puede registrar el pago.'
      }
      return
    }

    isSubmitting.value = true
    error.value = null

    try {
      // Procesar pagos: convertir a formato del API
      const processedPayments = payments.value
        .filter((payment) => {
          const amount = Number(payment.amount)
          return !isNaN(amount) && amount > 0
        })
        .map((payment, index) => {
          const due = memberDues.value[index]
          let description = payment.description
          const noveltyComment = payment.noveltyComment

          if (due) {
            if (
              due.type === 'stock_fee' &&
              due.stock_quantity &&
              due.monthly_contribution
            ) {
              description = `${due.description}, ${Number(
                due.stock_quantity
              ).toFixed(2)} uds. x ${due.monthly_contribution.toFixed(2)} c/u`
            } else if (due.type === 'loan_payment' && due.details) {
              const interest = due.details.interest || 0
              const principal = payment.amount - interest
              description = `${due.description}, Abono Capital: ${principal.toFixed(
                2
              )}, Intereses: ${interest.toFixed(2)}`
            }
          }

          const processedPayment: any = {
            type: payment.type,
            amount: Number(payment.amount),
            description,
            referenceId: payment.referenceId,
          }

          if (payment.type === 'novelty') {
            processedPayment.noveltyComment = noveltyComment
          }

          return processedPayment
        })

      // Llamar al API para registrar el pago
      const response = await membersApi.recordMonthlyPayment(
        selectedMember.value.id,
        {
          payments: processedPayments,
          meetingId: store.meetingId,
        }
      )

      // Actualizar estado local con el pago registrado
      completedPayments.value.push({
        memberName: selectedMember.value.name,
        amount: response.total_amount,
      })

      paidMemberIds.value.push(selectedMember.value.id)

      // Limpiar selección
      memberDues.value = []
      payments.value = []
    } catch (e) {
      const errorMessage =
        e instanceof Error
          ? e.message
          : 'Error desconocido al registrar el pago'
      error.value = errorMessage
      console.error('Error al registrar pago mensual:', e)
      throw e
    } finally {
      isSubmitting.value = false
    }
  }

  async function fetchMeetingPayments(
    meetingId: string,
    members: Member[]
  ): Promise<void> {
    try {
      if (!meetingId) {
        console.error('No meeting ID found')
        return
      }

      const operationMap = new Map<string, any[]>()
      const paymentsList: CompletedPayment[] = []

      // Consultar detalles de pagos para todos los miembros (para calcular totales)
      if (members.length > 0) {
        const paymentPromises = members.map(async (member) => {
          const memberId = member.id
          try {
            const memberPayments = await membersApi.getMemberPayments(
              memberId,
              {
                meeting_id: meetingId,
                type: 'monthly_payment',
              }
            )
            if (memberPayments && memberPayments.length > 0) {
              // Convertir a Operation para calcular totales
              const operations = memberPayments.map((p) =>
                mapPaymentToOperation(p, memberId)
              )

              // Actualizar las operaciones en el mapa con los detalles completos
              operationMap.set(memberId, operations)

              // Calcular montos para este miembro
              const amount = sumCashEntries(operations)

              paymentsList.push({ memberName: member.name, amount })
            }
          } catch (error) {
            // Ignorar errores individuales
            console.debug(
              `Error fetching payment details for member ${memberId}:`,
              error
            )
          }
        })

        await Promise.all(paymentPromises)
      }

      paidMemberOperations.value = operationMap
      paidMemberIds.value = Array.from(operationMap.keys())
      completedPayments.value = paymentsList
    } catch (error) {
      console.error('Error fetching meeting payments', error)
    }
  }

  function reset() {
    memberDues.value = []
    payments.value = []
    error.value = null
  }

  return {
    // State
    selectedMember,
    memberDues,
    payments,
    completedPayments,
    paidMemberIds,
    paidMemberOperations,
    loadingDues,
    isSubmitting,
    error,
    // Modals state
    isLoanModalOpen,
    editingLoanIndex,
    isFineModalOpen,
    editingFineData,
    editingFineIndex,
    isNoveltyModalOpen,
    // Computed
    indexedDues,
    stockDues,
    otherDues,
    loanDues,
    noveltyPayments,
    editingLoanDue,
    totalToPay,
    totalInterest,
    // Methods
    isMemberPaid,
    mapPaymentToOperation,
    handleFineUpdate,
    handleLoanPaymentUpdate,
    deletePayment,
    editPayment,
    addFine,
    addNovelty,
    handleNoveltySave,
    deleteNovelty,
    recalculateInsurance,
    loadMemberDues,
    handlePayment,
    fetchMeetingPayments,
    reset,
  }
}

