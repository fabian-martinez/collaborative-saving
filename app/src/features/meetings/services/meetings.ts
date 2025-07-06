import { api } from '@/services/api';
import type { Meeting, Payment } from '../types';

export const meetingsService = {
  getMeetings: (): Promise<Meeting[]> => {
    return api.get<Meeting[]>('/meetings');
  },

  startNewMeeting: (): Promise<Meeting> => {
    return api.post<Meeting>('/meetings', {});
  },

  closeMeeting: (meetingId: string): Promise<void> => {
    return api.patch<void>(`/meetings/${meetingId}/close`, {});
  },

  getActiveMeetingMemberDues: (memberId: string): Promise<Payment[]> => {
    return api.get<Payment[]>(`/meetings/active/member-dues/${memberId}`);
  },

  recordMeetingTransactions: (payload: {
    memberId: string;
    payments: Payment[];
  }): Promise<void> => {
    return api.post<void>('/meetings/active/record-transactions', payload);
  },
}; 