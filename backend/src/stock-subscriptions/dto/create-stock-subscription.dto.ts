import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class CreateStockSubscriptionDto {
  @ApiProperty({
    description: 'The ID of the member subscribing to the stock',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  member_id: string;

  @ApiProperty({
    description: 'The ID of the stock type being subscribed to',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  stock_id: string;

  @ApiProperty({
    description: 'The number of stock units to subscribe to',
    example: 5,
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'The ID of the loan that financed this subscription, if any',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    nullable: true,
    required: false,
  })
  @IsUUID()
  @IsOptional()
  financing_loan_id?: string | null;
}
