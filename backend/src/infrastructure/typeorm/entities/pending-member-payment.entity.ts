import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Member } from './member.entity';
import { Meeting } from './meeting.entity';
import { Stock } from './stock.entity';
import { Loan } from './loan.entity';
import { StockSubscription } from './stock-subscription.entity';

@Entity({ name: 'pending_member_payments' })
export class PendingMemberPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'member_id' })
  memberId: string;

  @Column({ type: 'uuid', name: 'meeting_id' })
  meetingId: string;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'text', default: 'pending' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'uuid', name: 'stock_id', nullable: true })
  stockId: string | null;

  @Column({ type: 'uuid', name: 'loan_id', nullable: true })
  loanId: string | null;

  @Column({ type: 'uuid', name: 'stock_subscription_id', nullable: true })
  stockSubscriptionId: string | null;

  @Column({ type: 'uuid', name: 'reference_meeting_id', nullable: true })
  referenceMeetingId: string | null;

  @Column({ type: 'text', name: 'disbursement_type', nullable: true })
  disbursementType: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @ManyToOne(() => Meeting)
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting;

  @ManyToOne(() => Stock, { nullable: true })
  @JoinColumn({ name: 'stock_id' })
  stock: Stock | null;

  @ManyToOne(() => Loan, { nullable: true })
  @JoinColumn({ name: 'loan_id' })
  loan: Loan | null;

  @ManyToOne(() => StockSubscription, { nullable: true })
  @JoinColumn({ name: 'stock_subscription_id' })
  stockSubscription: StockSubscription | null;

  @ManyToOne(() => Meeting, { nullable: true })
  @JoinColumn({ name: 'reference_meeting_id' })
  referenceMeeting: Meeting | null;
}
