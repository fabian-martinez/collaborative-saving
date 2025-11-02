import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Member } from './member.entity';
import { Stock } from './stock.entity';

@Entity({ name: 'stock_subscriptions' })
export class StockSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'member_id' })
  memberId: string;

  @Column({ type: 'uuid', name: 'stock_id' })
  stockId: string;

  @Column({ type: 'numeric', precision: 20, scale: 10, default: 1 })
  quantity: number;

  @Column({
    type: 'date',
    name: 'purchase_date',
    default: () => 'CURRENT_DATE',
  })
  purchaseDate: Date;

  @Column({ type: 'text', default: 'active' })
  status: string;

  @Column({ type: 'uuid', name: 'financing_loan_id', nullable: true })
  financingLoanId: string | null;

  // Relationships
  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @ManyToOne(() => Stock)
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;
}
