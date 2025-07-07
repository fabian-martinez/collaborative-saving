import { api } from '@/services/api';
import type { Operation } from '../types';

class OperationsService {
  async findOne(id: string): Promise<Operation> {
    return api.get(`/operations/${id}`);
  }

  async getOperations(meetingId: string): Promise<Operation[]> {
    try {
      return await api.get<Operation[]>(`/operations?meetingId=${meetingId}`);
    } catch (error) {
      console.error('Error fetching operations:', error);
      throw error;
    }
  }
}

export const operationsService = new OperationsService(); 