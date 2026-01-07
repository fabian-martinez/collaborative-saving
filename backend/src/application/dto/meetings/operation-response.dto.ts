import { OperationType } from '@domain/enums/operation-type.enum';

export interface OperationResponseDto {
  id: string;
  memberId: string | null;
  meetingId: string;
  type: OperationType;
  date: Date;
  description?: string | null;
  totalAmount?: number;
}
