import { api } from '@/services/api'
import type { DisbursementPlan } from '../types'

export default {
  // Obtiene el plan de desembolso pendiente y el efectivo disponible
  async getDisbursementPlanPreview(meetingId: string) {
    return api.get(`/meetings/${meetingId}/disbursement-plan/preview`)
  },
  // Ejecuta el plan de desembolso
  async executeDisbursementPlan(meetingId: string, plan: DisbursementPlan[]) {
    console.log('plan', plan)
    console.log('plan items details:', plan.map((item, index) => ({
      index,
      memberId: item.memberId,
      type: item.type,
      amount: item.amount,
      pendingMemberPaymentId: item.pendingMemberPaymentId,
      loanId: item.loanId
    })))
    return api.post(`/meetings/${meetingId}/disbursement-plan/execute`, { plan })
  },
} 