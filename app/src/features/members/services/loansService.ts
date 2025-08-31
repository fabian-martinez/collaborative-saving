import { api } from '@/services/api';
import type { Loan, MemberLoansResponse, LoanInstallments } from '../types';

export interface OrganizationLoansSummary {
  totalLoans: number;
  totalApprovedAmount: number;
  totalOutstandingBalance: number;
  totalMonthlyPayments: number;
  averageLoanAmount: number;
  averageInterestRate: number;
  loansByStatus: Record<string, number>;
  loansByType: Record<string, number>;
  message?: string;
}

export interface LoansPerformanceAnalysis {
  period: string;
  analysisDate: string;
  totalLoans: number;
  performanceMetrics: {
    defaultRate: number;
    averagePaymentRate: number;
    totalInterestCollected: number;
    averageLoanTerm: number;
  };
  riskAssessment: {
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
  };
  recommendations: string[];
  message?: string;
}

export interface LoansRiskAssessment {
  assessmentDate: string;
  totalLoans: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  defaultProbability: number;
  averageCreditScore: number;
  collateralCoverage: number;
  recommendations: string[];
  message?: string;
}

export const loansService = {
  // Get all loans
  getAllLoans: (): Promise<Loan[]> => {
    return api.get<Loan[]>('/loans');
  },

  // Get loan by ID
  getLoanById: (id: string): Promise<Loan> => {
    return api.get<Loan>(`/loans/${id}`);
  },

  // Get member loans summary
  getMemberLoanSummary: (memberId: string): Promise<MemberLoansResponse> => {
    return api.get<MemberLoansResponse>(`/loans/member/${memberId}/summary`);
  },

  // Get loan installments
  getLoanInstallments: (
    loanId: string,
    options?: {
      includePaid?: boolean;
    }
  ): Promise<LoanInstallments> => {
    const params = new URLSearchParams();
    
    if (options?.includePaid !== undefined) {
      params.append('includePaid', options.includePaid.toString());
    }

    return api.get<LoanInstallments>(`/loans/${loanId}/installments?${params.toString()}`);
  },

  // Get organization loans summary
  getOrganizationLoansSummary: (): Promise<OrganizationLoansSummary> => {
    return api.get<OrganizationLoansSummary>('/loans/organization/summary');
  },

  // Get loans performance analysis
  getLoansPerformanceAnalysis: (period?: string): Promise<LoansPerformanceAnalysis> => {
    const params = new URLSearchParams();
    
    if (period) params.append('period', period);

    return api.get<LoansPerformanceAnalysis>(`/loans/performance/analysis?${params.toString()}`);
  },

  // Get loans risk assessment
  getLoansRiskAssessment: (): Promise<LoansRiskAssessment> => {
    return api.get<LoansRiskAssessment>('/loans/risk/assessment');
  },
};
