import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { PaymentFilterType } from '@domain/enums/payment-filter-type.enum';

/**
 * Get Member Payments Query HTTP DTO
 *
 * Query parameters for retrieving member payments.
 */
export class GetMemberPaymentsQueryHttpDto {
  @ApiPropertyOptional({
    description: 'Filter by payment type',
    enum: PaymentFilterType,
    example: PaymentFilterType.MONTHLY_PAYMENT,
  })
  @IsOptional()
  @IsEnum(PaymentFilterType)
  type?: PaymentFilterType;

  @ApiPropertyOptional({
    description: 'Filter by meeting ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  meeting_id?: string;
}
