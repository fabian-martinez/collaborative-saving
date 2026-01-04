import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentItemHttpDto } from './payment-item-http.dto';

/**
 * Record Monthly Payments HTTP DTO
 *
 * HTTP request DTO for recording monthly payments.
 * Note: memberId is not included here as it comes from the URL path parameter.
 */
export class RecordMonthlyPaymentsHttpDto {
  @ApiProperty({
    description: 'Array of payments to record',
    type: [PaymentItemHttpDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one payment is required' })
  @ValidateNested({ each: true })
  @Type(() => PaymentItemHttpDto)
  payments: PaymentItemHttpDto[];

  @ApiPropertyOptional({
    description:
      'Optional meeting ID. If not provided, the active meeting will be used',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  meeting_id?: string;
}
