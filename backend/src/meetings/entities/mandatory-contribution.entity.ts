import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'mandatory_contributions' })
export class MandatoryContribution {
  @ApiProperty({
    description: 'The unique identifier for the mandatory contribution',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description:
      'The type of asset for the contribution (e.g., stock, savings)',
    example: 'stock',
  })
  @Column({ type: 'text', unique: true })
  asset_type: string;

  @ApiProperty({
    description: 'The total amount required for this contribution type',
    example: 100,
  })
  @Column({ type: 'numeric' })
  total: number;
}
