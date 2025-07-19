import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Member } from '../../members/entities/member.entity';
import { Meeting } from './meeting.entity';
import { PendingPaymentType } from '../../common/enums/pending-payment-type.enum';

@Entity('pending_member_payments')
export class PendingMemberPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  member_id: string;

  @Column('uuid')
  meeting_id: string;

  @Column({ type: 'text' })
  type: PendingPaymentType;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'text', default: 'pending' })
  status: 'pending' | 'approved' | 'rejected' | 'paid';

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  loan_id?: string | null;

  @Column({ type: 'uuid', nullable: true })
  stock_id?: string | null;

  @Column({ type: 'uuid', nullable: true })
  stock_subscription_id?: string | null;

  @Column({ type: 'uuid', nullable: true })
  reference_meeting_id?: string | null;

  @Column({ type: 'text', nullable: true })
  disbursement_type?: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ManyToOne(() => Member, { eager: true })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @ManyToOne(() => Meeting, { eager: false })
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting;
}
