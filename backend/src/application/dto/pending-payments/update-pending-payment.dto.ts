import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { PendingMemberPaymentStatus } from '@domain/entities/pending-member-payment.entity';

export class UpdatePendingPaymentDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsEnum(PendingMemberPaymentStatus)
  status?: PendingMemberPaymentStatus;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
