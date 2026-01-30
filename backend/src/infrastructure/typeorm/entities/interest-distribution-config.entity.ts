import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LoanType } from './loan-type.entity';
import { StockType } from './stock-type.entity';

@Entity({ name: 'interest_distribution_configs' })
export class InterestDistributionConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'loan_type_id' })
  loanTypeId: string;

  @Column({ type: 'uuid', name: 'stock_type_id' })
  stockTypeId: string;

  @ManyToOne(() => LoanType)
  @JoinColumn({ name: 'loan_type_id' })
  loanType: LoanType;

  @ManyToOne(() => StockType)
  @JoinColumn({ name: 'stock_type_id' })
  stockType: StockType;
}
