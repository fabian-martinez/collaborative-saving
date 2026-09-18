/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import apiClient from './client';

export interface ShareTypeSummary {
  type: string;
  nominal_value: number;
  total_shares: number;
  total_amount: number;
  subscribers_count: number;
}

export interface ShareholderSummary {
  member_id: string;
  name: string;
  shares_count: number;
  total_amount: number;
}

export interface LoanPortfolioTypeSummary {
  loan_type: string;
  monthly_interest_rate: number;
  active_loans_count: number;
  total_amount: number;
}

export interface DebtorSummary {
  member_id: string;
  name: string;
  loan_type: string;
  total_debt: number;
  status: 'Al día' | 'En mora';
}

export interface ReserveFundSummary {
  name: string;
  description?: string;
  amount: number;
}

export interface FundSummary {
  total_patrimony: number;
  solvency_percentage: number;
  is_solvent: boolean;
  total_social_capital: number;
  total_shares_count: number;
  shares_by_type: ShareTypeSummary[];
  shareholders: ShareholderSummary[];
  total_loans_balance: number;
  active_loans_count: number;
  loans_by_type: LoanPortfolioTypeSummary[];
  debtors: DebtorSummary[];
  total_reserve_funds: number;
  reserve_funds: ReserveFundSummary[];
}

export const fundApi = {
  async getFundSummary(): Promise<FundSummary> {
    const response = await apiClient.get<FundSummary>(
      '/v2/dashboard/fund-summary'
    );
    return response.data;
  },
};
