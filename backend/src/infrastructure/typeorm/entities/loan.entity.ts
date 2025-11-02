import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Member } from './member.entity';
import { Stock } from './stock.entity';

@Entity({ name: 'loans' })
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'member_id' })
  memberId: string;

  @Column({ type: 'text', name: 'loan_type' })
  loanType: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'approved_amount' })
  approvedAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'disbursed_amount',
    default: 0,
  })
  disbursedAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'outstanding_balance',
    default: 0,
  })
  outstandingBalance: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'monthly_payment_amount',
  })
  monthlyPaymentAmount: number;

  @Column({ type: 'decimal', precision: 4, scale: 4, name: 'interest_rate' })
  interestRate: number;

  @Column({ type: 'integer', default: 24 })
  term: number;

  @Column({ type: 'text', default: 'pending' })
  status: string;

  @Column({
    type: 'date',
    name: 'creation_date',
    default: () => 'CURRENT_DATE',
  })
  creationDate: Date;

  @Column({ type: 'uuid', name: 'guaranteed_stock_id', nullable: true })
  guaranteedStockId: string | null;

  // Relationships
  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @ManyToOne(() => Stock, { nullable: true })
  @JoinColumn({ name: 'guaranteed_stock_id' })
  guaranteedStock: Stock | null;
}
