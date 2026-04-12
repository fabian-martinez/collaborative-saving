import { IsOptional, IsString, IsEnum } from 'class-validator';
import {
  PendingMemberPaymentStatus,
  PendingMemberPaymentType,
} from '@domain/entities/pending-member-payment.entity';

export class GetPendingPaymentsQueryDto {
  @IsOptional()
  @IsEnum(PendingMemberPaymentStatus)
  status?: PendingMemberPaymentStatus;

  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @IsString()
  meetingId?: string;

  @IsOptional()
  @IsEnum(PendingMemberPaymentType)
  type?: PendingMemberPaymentType;
}
