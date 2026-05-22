import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateCdtHttpDto {
  @ApiProperty({
    description: 'The unique identifier of the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsNotEmpty()
  member_id: string;

  @ApiProperty({
    description: 'The amount invested in the CDT',
    example: 500000,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'The term of the CDT in months',
    example: 6,
  })
  @IsNumber()
  @IsPositive()
  term_months: number;
}
