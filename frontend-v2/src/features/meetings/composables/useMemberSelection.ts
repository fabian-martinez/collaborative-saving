import { ref, computed, type Ref } from 'vue'
import { membersApi, type Member, type MemberPayment } from '@/api/members.api'
import { useActiveMeetingStore } from '../stores/activeMeeting'
import { formatDate } from '@/shared/utils/formatters'
import { sumCashEntries } from '@/shared/utils'

export function useMemberSelection(
  paymentCollection: ReturnType<typeof import('./usePaymentCollection').usePaymentCollection>
) {
  const store = useActiveMeetingStore()

  // State
  const members = ref<Member[]>([])
  const selectedMember = ref<Member | null>(null)
  const viewedOperations = ref<any[] | null>(null)
  const loadingMembers = ref(false)
  const error = ref<string | null>(null)

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
    selectedMember.value = member
    paymentCollection.selectedMember.value = member
    viewedOperations.value = null
    paymentCollection.reset()
    error.value = null

    // Si el miembro tiene pagos, consultar detalles del endpoint de pagos del miembro
    if (store.meetingId && paymentCollection.isMemberPaid(member.id)) {
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
          return // Mostrar pagos
        }
      } catch (error) {
        // Si falla, mostrar operaciones básicas guardadas
        console.warn('Error fetching member payments details:', error)
        viewedOperations.value =
          paymentCollection.paidMemberOperations.value.get(member.id) || []
        return
      }
    }

    // Si no tiene pagos, cargar deudas
    await paymentCollection.loadMemberDues(member)
  }

  async function loadMembers(): Promise<void> {
    loadingMembers.value = true
    error.value = null
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
    selectedMember.value = null
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

