/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import apiClient from './client';

/**
 * Represents a stock in the system matching StockResponseHttpDto from backend.
 * All property names strictly adhere to snake_case API payload convention.
 */
export interface Stock {
  id: string;
  name: string;
  type: string;
  stock_type_id?: string | null;
  value: number;
  monthly_contribution: number;
  is_guaranteed?: boolean;
  guaranteed_yield?: number | null;
  behavior?: string;
  created_at?: string | Date;
}

export const stocksApi = {
  async getStocks(): Promise<Stock[]> {
    const response = await apiClient.get<Stock[]>('/v2/stocks');
    return response.data;
  },

  async getStockById(id: string): Promise<Stock> {
    const response = await apiClient.get<Stock>(`/v2/stocks/${id}`);
    return response.data;
  },
};
