import { ref, computed } from 'vue'
import { membersApi, type Member } from '@/api/members.api'
import { useActiveMeetingStore } from '../stores/activeMeeting'
import { formatDate } from '@/shared/utils/formatters'
import { sumCashEntries } from '@/shared/utils'

export function useMemberSelection(
  paymentCollection: ReturnType<typeof import('./usePaymentCollection').usePaymentCollection>
) {
  const store = useActiveMeetingStore()

  // State
  const members = ref<Member[]>([])
  const selectedMemberId = ref<string | null>(null)
  const viewedOperations = ref<any[] | null>(null)
  const loadingMembers = ref(false)
  const error = ref<string | null>(null)

  // Computed: obtener el objeto Member completo desde el ID
  // Usar shallowRef para mejor compatibilidad con Safari
  const selectedMember = computed(() => {
    if (!selectedMemberId.value) return null
    const found = members.value.find(m => m.id === selectedMemberId.value)
    // Retornar null explícitamente si no se encuentra para evitar problemas de reactividad en Safari
    return found || null
  })

  // Computed
  const printDate = computed(() => {
    if (!viewedOperations.value || viewedOperations.value.length === 0) {
      return formatDate(new Date())
    }
    // Usar la fecha de la primera operación
    const firstOp = viewedOperations.value[0]
    return formatDate(firstOp.date || new Date())
  })

  const viewedTotal = computed(() =>
    sumCashEntries(viewedOperations.value || [])
  )

  // Helper para actualizar completedPayments cuando se obtienen detalles de un miembro
  function updateCompletedPayments(member: Member, operations: any[]): void {
    const totalAmount = sumCashEntries(operations)
    const existingIndex = paymentCollection.completedPayments.value.findIndex(
      (p) => p.memberName === member.name
    )
    if (existingIndex >= 0) {
      // Actualizar el monto existente
      paymentCollection.completedPayments.value[existingIndex].amount = totalAmount
    } else {
      // Agregar nuevo pago si tiene monto
      if (totalAmount > 0) {
        paymentCollection.completedPayments.value.push({
          memberName: member.name,
          amount: totalAmount,
        })
      }
    }
  }

  // Helpers
  function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 0) return ''
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  function getMemberColor(memberId: string): string {
    const colors = [
      '#3b82f6', // blue
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#f59e0b', // amber
      '#10b981', // green
      '#06b6d4', // cyan
      '#ef4444', // red
      '#6366f1', // indigo
    ]
    let hash = 0
    for (let i = 0; i < memberId.length; i++) {
      hash = memberId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  async function selectMember(member: Member): Promise<void> {
    // Limpiar selección anterior antes de seleccionar el nuevo miembro
    if (selectedMemberId.value && selectedMemberId.value !== member.id) {
      viewedOperations.value = null
      paymentCollection.reset()
    }

    // Establecer el nuevo miembro seleccionado usando solo el ID
    selectedMemberId.value = member.id
    // Sincronizar con paymentCollection usando el objeto completo del array
    const memberFromArray = members.value.find(m => m.id === member.id) || member
    paymentCollection.selectedMember.value = memberFromArray
    error.value = null

    // Si el miembro tiene pagos, usar primero los datos ya cargados en cache
    if (store.meetingId && paymentCollection.isMemberPaid(member.id)) {
      // Primero intentar usar los datos ya cargados en paidMemberOperations
      const cachedOperations = paymentCollection.paidMemberOperations.value.get(member.id)
      if (cachedOperations && cachedOperations.length > 0) {
        viewedOperations.value = cachedOperations
        // Actualizar completedPayments con el total del miembro desde cache
        updateCompletedPayments(member, cachedOperations)
        return // Mostrar pagos desde cache
      }

      // Solo hacer la llamada si no hay datos en cache
      try {
        const memberPayments = await membersApi.getMemberPayments(member.id, {
          meeting_id: store.meetingId,
          type: 'monthly_payment',
        })

        if (memberPayments && memberPayments.length > 0) {
          const operations = memberPayments.map((p) =>
            paymentCollection.mapPaymentToOperation(p, member.id)
          )
          viewedOperations.value = operations
          // Actualizar el cache para futuras consultas
          paymentCollection.paidMemberOperations.value.set(member.id, operations)
          // Actualizar completedPayments con el total del miembro
          updateCompletedPayments(member, operations)
          return // Mostrar pagos
        }
      } catch (error) {
        // Si falla, mostrar operaciones básicas guardadas
        console.warn('Error fetching member payments details:', error)
        const fallbackOperations = paymentCollection.paidMemberOperations.value.get(member.id) || []
        viewedOperations.value = fallbackOperations
        if (fallbackOperations.length > 0) {
          updateCompletedPayments(member, fallbackOperations)
        }
        return
      }
    }

    // Si no tiene pagos, cargar deudas
    await paymentCollection.loadMemberDues(member)
  }

  async function loadMembers(): Promise<void> {
    loadingMembers.value = true
    error.value = null
    // Limpiar selección anterior al cargar nuevos miembros
    selectedMemberId.value = null
    paymentCollection.selectedMember.value = null
    viewedOperations.value = null
    try {
      members.value = await membersApi.getMembers()

      // Asegurar que el meetingId esté disponible
      if (!store.meetingId) {
        await store.fetchActiveMeeting()
      }

      if (store.meetingId) {
        await paymentCollection.fetchMeetingPayments(
          store.meetingId,
          members.value
        )
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar miembros'
    } finally {
      loadingMembers.value = false
    }
  }

  function clearSelection() {
    selectedMemberId.value = null
    paymentCollection.selectedMember.value = null
    viewedOperations.value = null
    paymentCollection.reset()
  }

  return {
    // State
    members,
    selectedMember,
    viewedOperations,
    loadingMembers,
    error,
    // Computed
    printDate,
    viewedTotal,
    // Methods
    getInitials,
    getMemberColor,
    selectMember,
    loadMembers,
    clearSelection,
  }
}
