import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Loan } from './loan.entity';
import { TransactionType } from '../../common/enums/transaction-type.enum';

@Entity({ name: 'loan_transaction_details' })
export class LoanTransactionDetail {
  @ApiProperty({
    description: 'The unique identifier for the loan transaction detail',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The ID of the loan this transaction belongs to',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @Column({ type: 'uuid' })
  loan_id: string;

  @ApiProperty({
    description: 'The type of transaction (e.g., payment, interest)',
    example: TransactionType.PRINCIPAL_PAYMENT,
    enum: TransactionType,
  })
  @Column({ type: 'text' })
  transaction_type: TransactionType;

  @ApiProperty({ description: 'The amount of the transaction', example: 100.5 })
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @ApiProperty({
    description: 'The date the transaction occurred',
    example: '2024-01-15',
  })
  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  transaction_date: string;

  @ApiProperty({
    description: 'Optional notes for the transaction',
    example: 'Monthly payment',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', name: 'operation_id' })
  operation_id: string;

  // Relationships
  @ManyToOne(() => Loan, (loan) => loan.transactions)
  @JoinColumn({ name: 'loan_id' })
  loan: Loan;
}
