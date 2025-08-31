import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Operation } from '../../operations/entities/operation.entity';
import { Loan } from '../../loans/entities/loan.entity';
import { Stock } from '../../stocks/entities/stock.entity';
import { MandatoryContribution } from '../../mandatory-contributions/entities/mandatory-contribution.entity';
import { StockSubscription } from '../../stock-subscriptions/entities/stock-subscription.entity';

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
    description: 'The ID of the member this entry affects',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    nullable: true,
  })
  @Column({ type: 'uuid', nullable: true })
  member_id: string;

  @ApiProperty({
    description: 'The type of account affected (e.g., cash, loan_portfolio)',
    example: 'cash',
  })
  @Column({ type: 'text' })
  account_type: string;

  @ApiProperty({
    description: 'A human-readable description for the entry',
    example: 'Pago de cuota de préstamo',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description:
      'The amount of the entry. Positive for debits, negative for credits.',
    example: 150.75,
  })
  @Column({ type: 'decimal', precision: 12, scale: 2 })
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
  // Entidad afectada: préstamo
  @Column({ type: 'uuid', nullable: true })
  loan_id?: string;
  @ManyToOne(() => Loan, { nullable: true })
  @JoinColumn({ name: 'loan_id' })
  loan?: Loan;

  // Entidad afectada: acción
  @Column({ type: 'uuid', nullable: true })
  stock_id?: string;
  @ManyToOne(() => Stock, { nullable: true })
  @JoinColumn({ name: 'stock_id' })
  stock?: Stock;

  // Entidad afectada: contribución obligatoria
  @Column({ type: 'uuid', nullable: true })
  mandatory_contribution_id?: string;
  @ManyToOne(() => MandatoryContribution, { nullable: true })
  @JoinColumn({ name: 'mandatory_contribution_id' })
  mandatory_contribution?: MandatoryContribution;

  // Entidad afectada: suscripción de acción
  @Column({ type: 'uuid', nullable: true })
  stock_subscription_id?: string;
  @ManyToOne(() => StockSubscription, { nullable: true })
  @JoinColumn({ name: 'stock_subscription_id' })
  stock_subscription?: StockSubscription;
}
