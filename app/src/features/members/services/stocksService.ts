import { api } from '@/services/api';
import type { Stock, MemberStocksResponse, StockTransactionHistory } from '../types';

export interface OrganizationStocksSummary {
  totalStocks: number;
  totalValue: number;
  totalMonthlyContributions: number;
  stocksByType: Record<string, number>;
  averageValue: number;
  averageMonthlyContribution: number;
  message?: string;
}

export interface StocksPerformanceAnalysis {
  period: string;
  analysisDate: string;
  totalStocks: number;
  performanceMetrics: {
    averageYield: number;
    bestPerformer: string | null;
    worstPerformer: string | null;
    growthRate: number;
  };
  recommendations: string[];
  message?: string;
}

export const stocksService = {
  // Get all stocks
  getAllStocks: (): Promise<Stock[]> => {
    return api.get<Stock[]>('/stocks');
  },

  // Get stock by ID
  getStockById: (id: string): Promise<Stock> => {
    return api.get<Stock>(`/stocks/${id}`);
  },

  // Get member stocks summary
  getMemberStockSummary: (memberId: string): Promise<MemberStocksResponse> => {
    return api.get<MemberStocksResponse>(`/stocks/member/${memberId}/summary`);
  },

  // Get stock transaction history for a specific member
  getStockTransactionHistory: (
    stockId: string,
    memberId: string,
    options?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<StockTransactionHistory> => {
    const params = new URLSearchParams();
    
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    return api.get<StockTransactionHistory>(`/stocks/${stockId}/member/${memberId}/history?${params.toString()}`);
  },

  // Get organization stocks summary
  getOrganizationStocksSummary: (): Promise<OrganizationStocksSummary> => {
    return api.get<OrganizationStocksSummary>('/stocks/organization/summary');
  },

  // Get stocks performance analysis
  getStocksPerformanceAnalysis: (period?: string): Promise<StocksPerformanceAnalysis> => {
    const params = new URLSearchParams();
    
    if (period) params.append('period', period);

    return api.get<StocksPerformanceAnalysis>(`/stocks/performance/analysis?${params.toString()}`);
  },
};
