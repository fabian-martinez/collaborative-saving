import { api } from '@/services/api';
import type { Operation } from '../types';

export interface PaginatedOperationsResponse {
  data: Operation[];
  total: number;
}

class OperationsService {
  async findOne(id: string): Promise<Operation> {
    return api.get(`/operations/${id}`);
  }

  async getOperations(filter?: {meetingId?: string, memberId?: string, operationType?: string }): Promise<PaginatedOperationsResponse> {
    let params = new URLSearchParams()
    if (filter?.meetingId) {
      params.append('meetingId', filter.meetingId)
    }
    if (filter?.memberId) {
      params.append('memberId', filter.memberId)
    }
    if (filter?.operationType) {
      params.append('operationType', filter.operationType)
    }
    try {
      return await api.get<PaginatedOperationsResponse>(`/operations?${params.toString()}`);
    } catch (error) {
      console.error('Error fetching operations:', error);
      throw error;
    }
  }
}

export const operationsService = new OperationsService(); 