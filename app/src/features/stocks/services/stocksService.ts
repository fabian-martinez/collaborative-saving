import { api } from '@/services/api';
import type { Stock } from '../types';

// Helper to ensure numeric fields are numbers, as the backend sends them as strings.
const transformStock = (
  stock: Omit<Stock, 'value' | 'monthly_contribution'> & {
    value: string | number;
    monthly_contribution: string | number;
  }
): Stock => ({
  ...stock,
  value: Number(stock.value),
  monthly_contribution: Number(stock.monthly_contribution),
});

export const stocksService = {
  getStocks: async (): Promise<Stock[]> => {
    const stocks = await api.get<Stock[]>('/stocks');
    return stocks.map(transformStock);
  },

  createStock: async (stockData: Omit<Stock, 'id'>): Promise<Stock> => {
    const stock = await api.post<Stock>('/stocks', stockData);
    return transformStock(stock);
  },

  updateStock: async (id: string, stockData: Partial<Omit<Stock, 'id'>>): Promise<Stock> => {
    const stock = await api.patch<Stock>(`/stocks/${id}`, stockData);
    return transformStock(stock);
  },

  deleteStock: (id: string): Promise<void> => {
    return api.delete<void>(`/stocks/${id}`);
  },
}; 