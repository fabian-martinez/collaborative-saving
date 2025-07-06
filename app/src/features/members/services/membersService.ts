import { api } from '@/services/api';
import type { Member } from '../types';

export const membersService = {
  getMembers: (): Promise<Member[]> => {
    return api.get<Member[]>('/members');
  },

  getMemberById: (id: string): Promise<Member> => {
    return api.get<Member>(`/members/${id}`);
  },

  addContribution: (memberId: string, amount: number): Promise<void> => {
    // This endpoint is an assumption. It might need to be adjusted
    // based on the backend implementation.
    return api.post<void>(`/members/${memberId}/contributions`, { amount });
  },
}; 