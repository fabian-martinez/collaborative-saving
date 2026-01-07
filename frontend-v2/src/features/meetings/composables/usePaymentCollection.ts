import { ref, computed } from 'vue'
import { membersApi, type Member, type MemberDue, type MemberPayment } from '@/api/members.api'
import { meetingsApi, type Operation } from '@/api/meetings.api'
import { useActiveMeetingStore } from '../stores/activeMeeting'

export interface Payment {
  type: string
  description: string
  amount: number
  referenceId?: string
  noveltyComment?: string
  affectedPaymentType?: 'mandatory_contribution' | 'stock_fee' | 'loan_payment' | 'fee' | 'insurance'
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
      const due = memberDues.value[index]
      
      // Actualizar due
      due.description = data.description
      due.amount = amount
      
      // Buscar el payment correspondiente usando type y referenceId
      const paymentIndex = payments.value.findIndex((p) => {
        if (p.type !== due.type) return false
        if (due.reference_id && p.referenceId) {
          return due.reference_id === p.referenceId
        }
        if (!due.reference_id && !p.referenceId) {
          return true
        }
        return false
      })
      
      if (paymentIndex > -1) {
        payments.value[paymentIndex].amount = amount
        payments.value[paymentIndex].description = data.description
      }
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
      const index = editingLoanIndex.value
      const due = memberDues.value[index]
      
      // Buscar el payment correspondiente usando type y referenceId
      const paymentIndex = payments.value.findIndex((p) => {
        if (p.type !== due.type) return false
        if (due.reference_id && p.referenceId) {
          return due.reference_id === p.referenceId
        }
        if (!due.reference_id && !p.referenceId) {
          return true
        }
        return false
      })
      
      if (paymentIndex > -1) {
        payments.value[paymentIndex].amount = amount
      }
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
      const due = memberDues.value[originalDueIndex]
      
      // Eliminar del array de dues
      memberDues.value.splice(originalDueIndex, 1)
      
      // Buscar el payment correspondiente usando type y referenceId
      // en lugar de usar el índice directamente (porque puede haber novedades mezcladas)
      const paymentIndex = payments.value.findIndex((p) => {
        if (p.type !== due.type) return false
        // Si ambos tienen referenceId, deben coincidir
        if (due.reference_id && p.referenceId) {
          return due.reference_id === p.referenceId
        }
        // Si ninguno tiene referenceId, coinciden
        if (!due.reference_id && !p.referenceId) {
          return true
        }
        return false
      })
      
      if (paymentIndex > -1) {
        payments.value.splice(paymentIndex, 1)
      }
    }
  }

  function editPayment(index: number) {
    const due = memberDues.value[index]
    const dueType = due.type
    
    // Buscar el payment correspondiente usando type y referenceId
    const paymentIndex = payments.value.findIndex((p) => {
      if (p.type !== due.type) return false
      if (due.reference_id && p.referenceId) {
        return due.reference_id === p.referenceId
      }
      if (!due.reference_id && !p.referenceId) {
        return true
      }
      return false
    })
    
    if (dueType === 'loan_payment') {
      editingLoanIndex.value = index
      isLoanModalOpen.value = true
    } else if (dueType === 'fee') {
      editingFineIndex.value = index
      editingFineData.value = {
        description: due.description,
        amount: paymentIndex > -1 ? payments.value[paymentIndex].amount : due.amount,
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

  function handleNoveltySave(data: { amount: number; comment: string; affectedDue?: MemberDue | null }) {
    const amount = Number(data.amount) || 0
    const novelty: Payment = {
      type: 'novelty',
      description: data.comment || 'Novedad',
      amount: Math.abs(amount),
      noveltyComment: data.comment,
    }
    
    // Si hay un due afectado, asignar los campos necesarios
    if (data.affectedDue) {
      novelty.affectedPaymentType = data.affectedDue.type as 'mandatory_contribution' | 'stock_fee' | 'loan_payment' | 'fee' | 'insurance'
      if (data.affectedDue.reference_id) {
        novelty.referenceId = data.affectedDue.reference_id
      }
    }
    
    payments.value.push(novelty)
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
    payments.value.forEach((payment) => {
      // Buscar el due correspondiente usando type y referenceId
      if (payment.type === 'loan_payment') {
        const due = memberDues.value.find((d) => {
          const typeMatches = d.type === 'loan_payment'
          const referenceMatches = 
            (!payment.referenceId && !d.reference_id) ||
            (payment.referenceId && d.reference_id && payment.referenceId === d.reference_id)
          return typeMatches && referenceMatches
        })
        if (due && due.details) {
          const capitalPortion =
            payment.amount - (due.details.interest || 0)
          totalCapitalPayment += capitalPortion > 0 ? capitalPortion : 0
        }
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
        // Buscar el pago de seguro en payments usando type en lugar de índice
        const insurancePaymentIndex = payments.value.findIndex(
          (p) => p.type === 'insurance'
        )
        if (insurancePaymentIndex !== -1) {
          payments.value[insurancePaymentIndex].amount = amount
        }
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
        .map((payment) => {
          // Buscar el due correspondiente usando type y referenceId
          // Las novedades no tienen due correspondiente
          let due: MemberDue | undefined = undefined
          
          if (payment.type !== 'novelty') {
            due = memberDues.value.find((d) => {
              const typeMatches = d.type === payment.type
              const referenceMatches = 
                (!payment.referenceId && !d.reference_id) ||
                (payment.referenceId && d.reference_id && payment.referenceId === d.reference_id)
              return typeMatches && referenceMatches
            })
          }

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
            reference_id: payment.referenceId,
          }

          if (payment.type === 'novelty') {
            if (noveltyComment) {
              processedPayment.novelty_comment = noveltyComment
            }
            // Convertir campos de novedad a snake_case
            if (payment.affectedPaymentType) {
              processedPayment.affected_payment_type = payment.affectedPaymentType
            }
          }

          return processedPayment
        })

      // Llamar al API para registrar el pago
      const response = await membersApi.recordMonthlyPayment(
        selectedMember.value.id,
        {
          payments: processedPayments,
          meeting_id: store.meetingId,
        }
      )

      // Actualizar estado local con el pago registrado
      // Verificar si el miembro ya tiene un pago registrado para actualizarlo o agregarlo
      const existingPaymentIndex = completedPayments.value.findIndex(
        (p) => p.memberName === selectedMember.value!.name
      )
      if (existingPaymentIndex >= 0) {
        // Actualizar el monto existente
        completedPayments.value[existingPaymentIndex].amount = response.total_amount
      } else {
        // Agregar nuevo pago
        completedPayments.value.push({
          memberName: selectedMember.value.name,
          amount: response.total_amount,
        })
      }

      // Agregar el miembro a la lista de miembros con pagos si no está ya
      if (!paidMemberIds.value.includes(selectedMember.value.id)) {
        paidMemberIds.value.push(selectedMember.value.id)
      }

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

      // Usar el endpoint optimizado de reunión para identificar miembros con pagos
      const operations = await meetingsApi.getMeetingPayments(meetingId)

      // Extraer los member_id únicos y calcular totales por miembro
      const uniqueMemberIds = new Set<string>()
      const paymentsByMember = new Map<string, number>()

      operations.forEach((op: Operation) => {
        if (op.member_id) {
          uniqueMemberIds.add(op.member_id)
          // Sumar total_amount por miembro
          const currentTotal = paymentsByMember.get(op.member_id) || 0
          paymentsByMember.set(op.member_id, currentTotal + (op.total_amount || 0))
        }
      })

      // Actualizar paidMemberIds con los IDs únicos
      paidMemberIds.value = Array.from(uniqueMemberIds)

      // Mantener paidMemberOperations vacío inicialmente
      // Se llenará cuando se seleccione un miembro específico
      paidMemberOperations.value = new Map<string, any[]>()

      // Actualizar completedPayments con los totales desde el endpoint
      // Crear un mapa de nombres de miembros para búsqueda rápida
      const memberMap = new Map<string, string>()
      members.forEach((member) => {
        memberMap.set(member.id, member.name)
      })

      // Actualizar o agregar completedPayments basado en los totales del endpoint
      paymentsByMember.forEach((totalAmount, memberId) => {
        const memberName = memberMap.get(memberId)
        if (memberName) {
          const existingIndex = completedPayments.value.findIndex(
            (p) => p.memberName === memberName
          )
          if (existingIndex >= 0) {
            // Actualizar el monto existente
            completedPayments.value[existingIndex].amount = totalAmount
          } else {
            // Agregar nuevo pago
            completedPayments.value.push({
              memberName,
              amount: totalAmount,
            })
          }
        }
      })
    } catch (error) {
      console.error('Error fetching meeting payments', error)
    }
  }

  function reset() {
    memberDues.value = []
    payments.value = []
    error.value = null
    // No limpiar selectedMember aquí porque se usa para mantener la selección
    // mientras se resetea el formulario de pago
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

