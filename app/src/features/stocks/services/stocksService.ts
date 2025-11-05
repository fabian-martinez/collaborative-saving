import { api } from '@/services/api';
import type { Stock, StockHistoryData, StockHistoryRequest } from '../types';

// Helper to ensure numeric fields are numbers, as the backend sends them as strings.
// Nota: Las respuestas ya vienen normalizadas a camelCase por el servicio API
const transformStock = (
  stock: Omit<Stock, 'value' | 'monthlyContribution' | 'subscriptionCount'> & {
    value: string | number;
    monthlyContribution: string | number;
    subscriptionCount?: string | number;
  }
): Stock => ({
  ...stock,
  value: Number(stock.value),
  monthlyContribution: Number(stock.monthlyContribution),
  subscriptionCount: stock.subscriptionCount ? Number(stock.subscriptionCount) : undefined,
});

export interface StockSubscription {
  id: string;
  memberId: string; // Normalizado de member_id
  stockId: string; // Normalizado de stock_id
  quantity: number;
  purchaseDate: string; // Normalizado de purchase_date
  status: string;
  financingLoanId?: string | null; // Normalizado de financing_loan_id
  stock?: Stock;
}

export interface StockModificationRequest {
  memberId: string;
  meetingId: string;
  modificationType: 'STOCK_MODIFICATION' | 'STOCK_TRANSFER' | 'STOCK_LOAN_PAYMENT';
  fromSubscriptionId?: string;
  fromQuantity?: number;
  toStockId?: string;
  toQuantity?: number;
  transferSubscriptionId?: string;
  transferQuantity?: number;
  toMemberId?: string;
  loanPaymentSubscriptionId?: string;
  loanPaymentQuantity?: number;
  loanId?: string;
  differenceHandling?: 'cash' | 'credit';
  targetLoanId?: string;
  notes?: string;
}

export interface StockModificationResponse {
  operationId: string;
  message: string;
  details: unknown;
}

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

  getStockSubscriptionsByMember: async (memberId: string): Promise<StockSubscription[]> => {
    const subscriptions = await api.get<StockSubscription[]>(`/stock-subscriptions/member/${memberId}`);
    return subscriptions.map(sub => ({
      ...sub,
      quantity: Number(sub.quantity),
      stock: sub.stock ? transformStock(sub.stock) : undefined
    }));
  },

  processStockModification: async (request: StockModificationRequest): Promise<StockModificationResponse> => {
    return api.post<StockModificationResponse>('/stocks/modify', request);
  },

  // Helper methods for specific scenarios
  processStockExchange: async (params: {
    memberId: string;
    meetingId: string;
    fromSubscriptionId: string;
    fromQuantity: number;
    toStockId: string;
    toQuantity: number;
    differenceHandling?: 'cash' | 'credit';
    targetLoanId?: string;
    notes?: string;
  }): Promise<StockModificationResponse> => {
    return stocksService.processStockModification({
      memberId: params.memberId,
      meetingId: params.meetingId,
      modificationType: 'STOCK_MODIFICATION',
      fromSubscriptionId: params.fromSubscriptionId,
      fromQuantity: params.fromQuantity,
      toStockId: params.toStockId,
      toQuantity: params.toQuantity,
      differenceHandling: params.differenceHandling,
      targetLoanId: params.targetLoanId,
      notes: params.notes,
    });
  },

  processStockTransfer: async (params: {
    memberId: string;
    meetingId: string;
    transferSubscriptionId: string;
    transferQuantity: number;
    toMemberId: string;
    notes?: string;
  }): Promise<StockModificationResponse> => {
    return stocksService.processStockModification({
      memberId: params.memberId,
      meetingId: params.meetingId,
      modificationType: 'STOCK_TRANSFER',
      transferSubscriptionId: params.transferSubscriptionId,
      transferQuantity: params.transferQuantity,
      toMemberId: params.toMemberId,
      notes: params.notes,
    });
  },

  processStockLoanPayment: async (params: {
    memberId: string;
    meetingId: string;
    loanPaymentSubscriptionId: string;
    loanPaymentQuantity: number;
    loanId: string;
    notes?: string;
  }): Promise<StockModificationResponse> => {
    return stocksService.processStockModification({
      memberId: params.memberId,
      meetingId: params.meetingId,
      modificationType: 'STOCK_LOAN_PAYMENT',
      loanPaymentSubscriptionId: params.loanPaymentSubscriptionId,
      loanPaymentQuantity: params.loanPaymentQuantity,
      loanId: params.loanId,
      notes: params.notes,
    });
  },

  getStockHistory: async (params?: StockHistoryRequest): Promise<StockHistoryData[]> => {
    const queryParams = new URLSearchParams();
    
    if (params?.stockType) {
      queryParams.append('stockType', params.stockType);
    }
    if (params?.includeTransfers !== undefined) {
      queryParams.append('includeTransfers', params.includeTransfers.toString());
    }
    if (params?.includeLoanPayments !== undefined) {
      queryParams.append('includeLoanPayments', params.includeLoanPayments.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/stocks/history?${queryString}` : '/stocks/history';
    
    return api.get<StockHistoryData[]>(url);
  },

  getStockOperationsForMemberInMeeting: async (memberId: string, meetingId: string): Promise<Array<{
    id: string;
    type: string;
    description: string;
    date: string;
    details: any;
  }>> => {
    return api.get<Array<{
      id: string;
      type: string;
      description: string;
      date: string;
      details: any;
    }>>(`/stocks/operations/member/${memberId}/meeting/${meetingId}`);
  },

  getAllStockOperationsForMeeting: async (meetingId: string): Promise<Array<{
    id: string;
    type: string;
    description: string;
    date: string;
    details: any;
    memberId: string;
    memberName: string;
  }>> => {
    return api.get<Array<{
      id: string;
      type: string;
      description: string;
      date: string;
      details: any;
      memberId: string;
      memberName: string;
    }>>(`/stocks/operations/meeting/${meetingId}`);
  },
}; 