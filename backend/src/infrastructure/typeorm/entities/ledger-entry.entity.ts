import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Operation } from './operation.entity';
import { Loan } from './loan.entity';
import { Stock } from './stock.entity';
import { MandatoryContribution } from './mandatory-contribution.entity';
import { StockSubscription } from './stock-subscription.entity';

@Entity({ name: 'ledger_entries' })
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'operation_id' })
  operationId: string;

  @Column({ type: 'text', name: 'account_type' })
  accountType: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Affected entity fields for traceability
  @Column({ type: 'uuid', name: 'loan_id', nullable: true })
  loanId: string | null;

  @Column({ type: 'uuid', name: 'stock_id', nullable: true })
  stockId: string | null;

  @Column({
    type: 'uuid',
    name: 'mandatory_contribution_id',
    nullable: true,
  })
  mandatoryContributionId: string | null;

  @Column({ type: 'uuid', name: 'stock_subscription_id', nullable: true })
  stockSubscriptionId: string | null;

  // Relationships
  @ManyToOne(() => Operation)
  @JoinColumn({ name: 'operation_id' })
  operation: Operation;

  @ManyToOne(() => Loan, { nullable: true })
  @JoinColumn({ name: 'loan_id' })
  loan: Loan | null;

  @ManyToOne(() => Stock, { nullable: true })
  @JoinColumn({ name: 'stock_id' })
  stock: Stock | null;

  @ManyToOne(() => MandatoryContribution, { nullable: true })
  @JoinColumn({ name: 'mandatory_contribution_id' })
  mandatoryContribution: MandatoryContribution | null;

  @ManyToOne(() => StockSubscription, { nullable: true })
  @JoinColumn({ name: 'stock_subscription_id' })
  stockSubscription: StockSubscription | null;
}
