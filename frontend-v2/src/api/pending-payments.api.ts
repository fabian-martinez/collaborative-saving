import apiClient from './client'

export interface PendingPayment {
  id: string
  memberId: string
  meetingId: string
  type: 'dividend' | 'stock_withdrawal' | 'loan' | 'other' | 'partial_settlement'
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  notes?: string | null
  createdAt: string
  referenceMeetingId?: string | null
  stockId?: string | null
  loanId?: string | null
  stockSubscriptionId?: string | null
  disbursementType?: string | null
  memberName?: string
  firstName?: string
  lastName?: string
}

export interface GetPendingPaymentsParams {
  status?: string
  memberId?: string
  meetingId?: string
  type?: string
}

export interface UpdatePendingPaymentData {
  amount?: number
  status?: 'pending' | 'approved' | 'rejected' | 'paid'
  notes?: string | null
}

const PENDING_PAYMENTS_URL = '/v2/pending-payments'

export const pendingPaymentsApi = {
  getPendingPayments: async (params?: GetPendingPaymentsParams): Promise<PendingPayment[]> => {
    const response = await apiClient.get<PendingPayment[]>(PENDING_PAYMENTS_URL, { params })
    return response.data
  },

  updatePendingPayment: async (id: string, data: UpdatePendingPaymentData): Promise<void> => {
    await apiClient.patch(`${PENDING_PAYMENTS_URL}/${id}`, data)
  },

  deletePendingPayment: async (id: string): Promise<void> => {
    await apiClient.delete(`${PENDING_PAYMENTS_URL}/${id}`)
  }
}
