/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import apiClient from './client';

export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  identification_number?: string;
  status: string;
  address?: string;
  phone?: string;
  beneficiary?: string;
  registration_date: string | Date;
  created_at?: string | Date;
}

export interface MemberDueDetails {
  interest: number;
  principal: number;
  outstanding_balance: number;
}

export interface MemberDue {
  type: string;
  description: string;
  amount: number;
  reference_id?: string;
  details?: MemberDueDetails;
  monthly_contribution?: number;
  stock_quantity?: number;
  novelty_comment?: string;
  creation_date?: string;
}

export interface Loan {
  id: string;
  member_id: string;
  loan_type: string;
  approved_amount: number;
  disbursed_amount: number;
  outstanding_balance: number;
  monthly_payment_amount: number;
  interest_rate: number;
  term: number;
  status: string;
  creation_date: string | Date;
  guaranteed_stock_id?: string | null;
}

export interface StockSubscription {
  id: string;
  stock_id: string;
  stock_type: string;
  quantity: number;
  purchase_date: string | Date;
  status: string;
  financing_loan_id?: string | null;
}

export interface MemberPaymentEntry {
  type: string;
  amount: number;
  description?: string;
}

export interface MemberPayment {
  operation_id: string;
  type: string;
  total_amount: number;
  description?: string;
  date: string | Date;
  meeting_id: string;
  entries: MemberPaymentEntry[];
}

export interface GetMemberPaymentsQuery {
  meeting_id?: string;
  type?: string;
}

export interface RecordMonthlyPaymentsRequest {
  payments: Array<{
    type: string;
    amount: number;
    description?: string;
    reference_id?: string;
  }>;
  meeting_id?: string;
}

export interface RecordMonthlyPaymentsResponse {
  operation_id: string;
  total_amount: number;
}

export interface PaymentScheduleItem {
  date: string | Date;
  type: 'historical' | 'projected';
  loan_id?: string;
  loan_type?: string;
  total_amount: number;
  interest_amount: number;
  principal_amount: number;
  status: 'paid' | 'pending' | 'overdue';
  operation_id?: string;
  remaining_balance?: number;
  payment_number?: number;
}

export interface PaymentScheduleSummary {
  total_paid: number;
  total_pending: number;
  next_payment_date?: string | Date;
  next_payment_amount: number;
  total_outstanding_balance: number;
}

export interface PaymentSchedule {
  member_id: string;
  historical_payments: PaymentScheduleItem[];
  projected_payments: PaymentScheduleItem[];
  summary: PaymentScheduleSummary;
}

export interface GetPaymentScheduleQuery {
  months?: number;
}

export const membersApi = {
  async getMembers(): Promise<Member[]> {
    const response = await apiClient.get<Member[]>('/v2/members');
    return response.data;
  },

  async getMemberById(id: string): Promise<Member> {
    const response = await apiClient.get<Member>(`/v2/members/${id}`);
    return response.data;
  },

  async getMemberDues(memberId: string): Promise<MemberDue[]> {
    const response = await apiClient.get<MemberDue[]>(
      `/v2/members/${memberId}/dues`
    );
    return response.data;
  },

  async getMemberLoans(memberId: string): Promise<Loan[]> {
    const response = await apiClient.get<Loan[]>(
      `/v2/members/${memberId}/loans`
    );
    return response.data;
  },

  async getMemberStockSubscriptions(
    memberId: string,
    includeInactive?: boolean
  ): Promise<StockSubscription[]> {
    const params = new URLSearchParams();
    if (includeInactive === true) {
      params.append('includeInactive', 'true');
    }
    const queryString = params.toString();
    const url = `/v2/members/${memberId}/stock-subscriptions${
      queryString ? `?${queryString}` : ''
    }`;
    const response = await apiClient.get<StockSubscription[]>(url);
    return response.data;
  },

  async getStockSubscriptionById(
    memberId: string,
    subscriptionId: string
  ): Promise<StockSubscription> {
    const response = await apiClient.get<StockSubscription>(
      `/v2/members/${memberId}/stock-subscriptions/${subscriptionId}`
    );
    return response.data;
  },

  async getMemberPayments(
    memberId: string,
    query?: GetMemberPaymentsQuery
  ): Promise<MemberPayment[]> {
    const params = new URLSearchParams();
    if (query?.meeting_id) params.append('meeting_id', query.meeting_id);
    if (query?.type) params.append('type', query.type);
    const queryString = params.toString();
    const url = `/v2/members/${memberId}/payments${
      queryString ? `?${queryString}` : ''
    }`;
    const response = await apiClient.get<MemberPayment[]>(url);
    return response.data;
  },

  async recordMonthlyPayment(
    memberId: string,
    data: RecordMonthlyPaymentsRequest
  ): Promise<RecordMonthlyPaymentsResponse> {
    const response = await apiClient.post<RecordMonthlyPaymentsResponse>(
      `/v2/members/${memberId}/payments`,
      data
    );
    return response.data;
  },

  async getMemberPaymentSchedule(
    memberId: string,
    query?: GetPaymentScheduleQuery
  ): Promise<PaymentSchedule> {
    const params = new URLSearchParams();
    if (query?.months !== undefined) {
      params.append('months', String(query.months));
    }
    const queryString = params.toString();
    const url = `/v2/members/${memberId}/payment-schedule${
      queryString ? `?${queryString}` : ''
    }`;
    const response = await apiClient.get<PaymentSchedule>(url);
    return response.data;
  },
};
