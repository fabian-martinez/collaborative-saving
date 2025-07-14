import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PendingMemberPayment } from '../meetings/entities/pending-member-payment.entity';

@Injectable()
export class DividendsService {
  constructor(private readonly dataSource: DataSource) {}

  async getPendingDividends(
    memberId?: string,
    meetingId?: string,
    status: string = 'pending',
  ) {
    const where: Record<string, any> = { type: 'dividendo' };
    if (memberId) where.member_id = memberId;
    if (meetingId) where.meeting_id = meetingId;
    if (status) where.status = status;
    return this.dataSource.manager.find(PendingMemberPayment, { where });
  }

  async getDividendHistory(
    memberId?: string,
    meetingId?: string,
    status?: string,
  ) {
    const where: Record<string, any> = { type: 'dividendo' };
    if (memberId) where.member_id = memberId;
    if (meetingId) where.meeting_id = meetingId;
    if (status) where.status = status;
    return this.dataSource.manager.find(PendingMemberPayment, { where });
  }
}
