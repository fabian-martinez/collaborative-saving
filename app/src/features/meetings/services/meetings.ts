import { api } from '@/services/api';
import type {
  Meeting,
  MemberDue,
  SimplifiedRecordTransactions,
} from '../types';
import type { Operation } from '@/features/operations/types';

class MeetingsService {
  // Methods related to meetings list and creation
  findAll(): Promise<Meeting[]> {
    return api.get('/meetings');
  }

  findActive(): Promise<Meeting | null> {
    return api.get('/meetings/active');
  }

  create(date: { date: string }): Promise<Meeting> {
    return api.post('/meetings', date);
  }

  close(id: string): Promise<Meeting> {
    return api.patch(`/meetings/${id}/close`, {});
  }

  // Methods related to active meeting collections
  getMemberDues(memberId: string): Promise<MemberDue[]> {
    return api.get(`/meetings/active/member-dues/${memberId}`);
  }

  recordMonthlyPayment(
    payload: SimplifiedRecordTransactions,
  ): Promise<void> {
    return api.post('/meetings/active/record-monthly-payment', payload);
  }

  getMonthlyPayments(meetingId: string): Promise<Operation[]> {
    return api.get(`/meetings/${meetingId}/monthly-payments`);
  }
}

export const meetingsService = new MeetingsService(); 