import { defineStore } from 'pinia'
import { ref } from 'vue'
import { membersApi, type Member, type MemberDue, type MemberPayment, type MemberPurchase } from '@/api/members.api'

export const useMemberDetailStore = defineStore('memberDetail', () => {
  const member = ref<Member | null>(null)
  const dues = ref<MemberDue[]>([])
  const payments = ref<MemberPayment[]>([])
  const purchases = ref<MemberPurchase[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

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

  function reset() {
    member.value = null
    dues.value = []
    payments.value = []
    purchases.value = []
    error.value = null
  }

  return {
    member,
    dues,
    payments,
    purchases,
    loading,
    error,
    fetchMember,
    fetchDues,
    fetchPayments,
    fetchPurchases,
    reset
  }
})

