import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Member } from '../../members/entities/member.entity';
import { Meeting } from '../../meetings/entities/meeting.entity';
import { LedgerEntry } from '../../ledger-entries/entities/ledger-entry.entity';

@Entity({ name: 'operations' })
export class Operation {
  @ApiProperty({
    description: 'The unique identifier for the operation',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The ID of the member performing the operation',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @Column({ type: 'uuid' })
  member_id: string;

  @ApiProperty({
    description: 'The ID of the meeting this operation is part of (if any)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    nullable: true,
  })
  @Column({ type: 'uuid', nullable: true })
  meeting_id: string | null;

  @ApiProperty({
    description: 'The timestamp when the operation occurred',
    example: '2024-01-15T10:30:00Z',
  })
  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  date: Date;

  @ApiProperty({
    description: 'A description of the operation',
    example: 'Loan payment for member',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  // Relationships
  @ApiProperty({ type: () => Member })
  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @ManyToOne(() => Meeting)
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting | null;

  @ApiProperty({ type: () => [LedgerEntry] })
  @OneToMany(() => LedgerEntry, (ledgerEntry) => ledgerEntry.operation)
  ledger_entries: LedgerEntry[];
}
