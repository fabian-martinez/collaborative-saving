import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Member } from '../../members/entities/member.entity';
import { LoanTransactionDetail } from './loan-transaction-detail.entity';

@Entity({ name: 'loans' })
export class Loan {
  @ApiProperty({
    description: 'The unique identifier for the loan',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The ID of the member who owns the loan',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @Column({ type: 'uuid' })
  member_id: string;

  @ApiProperty({
    description: 'The type of loan',
    example: 'corriente',
    enum: ['corriente', 'agil'],
  })
  @Column({ type: 'text' })
  loan_type: string;

  @ApiProperty({
    description: 'The total amount approved for the loan',
    example: 5000.0,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  approved_amount: number;

  @ApiProperty({
    description: 'The remaining balance to be paid',
    example: 2500.0,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  outstanding_balance: number;

  @ApiProperty({
    description: 'The interest rate for the loan (e.g., 0.02 for 2%)',
    example: 0.02,
  })
  @Column({ type: 'decimal', precision: 4, scale: 4 })
  interest_rate: number;

  @ApiProperty({
    description: 'The current status of the loan',
    example: 'active',
    enum: ['pending', 'active', 'paid', 'defaulted'],
  })
  @Column({ type: 'text', default: 'pending' })
  status: string;

  @ApiProperty({
    description: 'The date the loan was created',
    example: '2023-12-01',
  })
  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  creation_date: string;

  // Relationships
  @ApiProperty({ type: () => Member })
  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @ApiProperty({ type: () => [LoanTransactionDetail] })
  @OneToMany(() => LoanTransactionDetail, (transaction) => transaction.loan)
  transactions: LoanTransactionDetail[];
}
