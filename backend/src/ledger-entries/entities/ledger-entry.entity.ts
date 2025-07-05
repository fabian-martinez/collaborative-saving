import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Operation } from '../../operations/entities/operation.entity';

@Entity({ name: 'ledger_entries' })
export class LedgerEntry {
  @ApiProperty({
    description: 'The unique identifier for the ledger entry',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The ID of the operation this entry belongs to',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @Column({ type: 'uuid' })
  operation_id: string;

  @ApiProperty({
    description: 'The type of account affected (e.g., cash, loan_portfolio)',
    example: 'cash',
  })
  @Column({ type: 'text' })
  account_type: string;

  @ApiProperty({
    description:
      'The amount of the entry. Positive for debits, negative for credits.',
    example: 150.75,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    description: 'The timestamp when the entry was created',
    example: '2024-01-15T10:30:00Z',
  })
  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  // Relationships
  @ManyToOne(() => Operation, (operation) => operation.ledger_entries)
  @JoinColumn({ name: 'operation_id' })
  operation: Operation;
}
