import { api } from '@/services/api';
import type { Meeting, MemberDue, SimplifiedRecordTransactions } from '../types';

export const meetingsService = {
  getMeetings: (): Promise<Meeting[]> => {
    return api.get<Meeting[]>('/meetings');
  },

  getActiveMeeting: (): Promise<Meeting | null> => {
    return api.get<Meeting | null>('/meetings/active');
  },

  startNewMeeting: (): Promise<Meeting> => {
    return api.post<Meeting>('/meetings', {});
  },

  closeMeeting: (meetingId: string): Promise<void> => {
    return api.patch<void>(`/meetings/${meetingId}/close`, {});
  },

  getMemberDues: (memberId: string): Promise<MemberDue[]> => {
    return api.get<MemberDue[]>(`/meetings/active/member-dues/${memberId}`);
  },

  recordPayments: (payload: SimplifiedRecordTransactions): Promise<void> => {
    return api.post<void>('/meetings/active/record-payments', payload);
  },
}; 