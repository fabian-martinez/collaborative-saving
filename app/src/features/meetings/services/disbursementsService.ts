import { api } from '@/services/api'

export default {
  // Obtiene el plan de desembolso pendiente y el efectivo disponible
  async getDisbursementPlanPreview(meetingId: string) {
    return api.get(`/meetings/${meetingId}/disbursement-plan/preview`)
  },
  // Ejecuta el plan de desembolso
  async executeDisbursementPlan(meetingId: string, plan: any) {
    return api.post(`/meetings/${meetingId}/disbursement-plan/execute`, plan)
  },
} 