import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Member } from './member.entity';
import { Meeting } from './meeting.entity';

@Entity({ name: 'operations' })
export class Operation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'member_id', nullable: true })
  memberId: string | null;

  @Column({ type: 'uuid', name: 'meeting_id' })
  meetingId: string;

  @Column({ type: 'text' })
  type: string;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  date: Date;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Relationships
  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'member_id' })
  member: Member | null;

  @ManyToOne(() => Meeting)
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting;
}
