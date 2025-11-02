import { MemberDue } from '../../../dues/entities/member-due.entity';

export class RecordMonthlyPaymentsDto {
  memberId: string;
  payments: MemberDue[];
  meetingId?: string; // opcional, usa reuni?n activa si no se proporciona
}
