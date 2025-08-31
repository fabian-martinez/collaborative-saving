import { api } from '@/services/api';
import type { 
  Member, 
  MemberDetailResponse, 
  MemberStocksResponse, 
  MemberLoansResponse, 
  DebtCapacityResponse, 
  MemberSummaryResponse, 
  StockTransactionHistory, 
  LoanInstallments, 
  MemberTransactionsResponse,
  OrganizationDebtCapacityStats 
} from '../types';

export const membersService = {
  // Basic member operations
  getMembers: (): Promise<Member[]> => {
    return api.get<Member[]>('/members');
  },

  getMemberById: (id: string): Promise<Member> => {
    return api.get<Member>(`/members/${id}`);
  },

  // Member detail endpoints
  getMemberDetail: (id: string): Promise<MemberDetailResponse> => {
    return api.get<MemberDetailResponse>(`/members/${id}`);
  },

  getMemberStocks: (id: string): Promise<MemberStocksResponse> => {
    return api.get<MemberStocksResponse>(`/members/${id}/stocks`);
  },

  getMemberLoans: (id: string): Promise<MemberLoansResponse> => {
    return api.get<MemberLoansResponse>(`/members/${id}/loans`);
  },

  getMemberDebtCapacity: (id: string): Promise<DebtCapacityResponse> => {
    return api.get<DebtCapacityResponse>(`/members/${id}/debt-capacity`);
  },

  getMemberSummary: (id: string): Promise<MemberSummaryResponse> => {
    return api.get<MemberSummaryResponse>(`/members/${id}/summary`);
  },

  getMemberTransactions: (id: string): Promise<MemberTransactionsResponse> => {
    return api.get<MemberTransactionsResponse>(`/members/${id}/transactions`);
  },

  // Stock history endpoints
  getStockTransactionHistory: (stockId: string, memberId: string): Promise<StockTransactionHistory> => {
    return api.get<StockTransactionHistory>(`/members/${memberId}/stocks/${stockId}/history`);
  },

  // Loan installments endpoints
  getLoanInstallments: (loanId: string, memberId: string): Promise<LoanInstallments> => {
    return api.get<LoanInstallments>(`/members/${memberId}/loans/${loanId}/installments`);
  },

  // Debt capacity summary endpoints
  getDebtCapacitySummary: (memberIds: string[]): Promise<DebtCapacityResponse[]> => {
    const memberIdsParam = memberIds.join(',');
    return api.get<DebtCapacityResponse[]>(`/members/debt-capacity/summary?memberIds=${memberIdsParam}`);
  },

  getOrganizationDebtCapacityStats: (): Promise<OrganizationDebtCapacityStats> => {
    return api.get<OrganizationDebtCapacityStats>('/members/debt-capacity/organization-stats');
  },

  // Legacy endpoints (kept for backward compatibility)
  addContribution: (memberId: string, amount: number): Promise<void> => {
    return api.post<void>(`/members/${memberId}/contributions`, { amount });
  },
}; 