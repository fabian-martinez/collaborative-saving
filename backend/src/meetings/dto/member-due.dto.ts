import { ApiProperty } from '@nestjs/swagger';

export const MemberDueType = ['mandatory_contribution', 'stock_fee'] as const;

export class MemberDueDto {
  @ApiProperty({
    description: 'The type of the due',
    enum: MemberDueType,
    example: 'mandatory_contribution',
  })
  type: (typeof MemberDueType)[number];

  @ApiProperty({
    description: 'A description of the due',
    example: 'Aporte obligatorio',
  })
  description: string;

  @ApiProperty({
    description: 'The amount due',
    example: 150.0,
  })
  amount: number;
}
