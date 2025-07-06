import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTransactionPaymentDto } from './create-transaction-payment.dto';

export class SimplifiedRecordTransactionsDto {
  @ApiProperty({
    description: 'The ID of the member making the transactions',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  memberId: string;

  @ApiProperty({
    description: 'An array of payments to be recorded',
    type: [CreateTransactionPaymentDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionPaymentDto)
  payments: CreateTransactionPaymentDto[];
}
